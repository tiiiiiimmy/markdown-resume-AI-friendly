import localForage from "localforage";
import { acceptHMRUpdate, defineStore } from "pinia";
import type { ResumeListItem, ResumeStorageItem } from "~/types";
import {
  getBrowserResumeId,
  getLocalPickerWindow,
  isBrowserFileAccessSupported
} from "~/utils/browser-file-resumes";
import { DEFAULT_CSS_CONTENT, DEFAULT_STYLES } from "~/utils";
import { deleteStylesCache } from "~/utils/style-cache";

const MARKDOWN_PICKER_TYPES = [
  {
    description: "Markdown files",
    accept: {
      "text/markdown": [".md"],
      "text/plain": [".md"]
    }
  }
];

const isMarkdownFile = (name: string) => name.toLowerCase().endsWith(".md");

const sortResumes = (a: ResumeListItem, b: ResumeListItem) =>
  (b.update || b.id).localeCompare(a.update || a.id);

const getResumeName = (fileName: string) => fileName.replace(/\.md$/i, "");

const getResumeFromHandle = async (
  id: string,
  handle: FileSystemFileHandle,
  created?: string
): Promise<ResumeListItem> => {
  const file = await handle.getFile();
  const markdown = await file.text();
  const update = String(file.lastModified);

  return {
    id,
    name: getResumeName(file.name),
    markdown,
    css: DEFAULT_CSS_CONTENT,
    styles: DEFAULT_STYLES,
    source: "browser-file",
    fileName: file.name,
    created: created || update,
    update
  };
};

const collectMarkdownFileHandles = async (directoryHandle: FileSystemDirectoryHandle) => {
  const fileHandles: FileSystemFileHandle[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "directory") {
      fileHandles.push(...(await collectMarkdownFileHandles(entry)));
      continue;
    }

    if (entry.kind === "file" && isMarkdownFile(entry.name)) fileHandles.push(entry);
  }

  return fileHandles;
};

type StoredFileHandle = { handle: FileSystemFileHandle; created: string };

// Lazily created on first client-side use — avoids SSR crash (no IndexedDB in Node).
let _dirHandleStorage: ReturnType<typeof localForage.createInstance> | null = null;
let _fileHandleStorage: ReturnType<typeof localForage.createInstance> | null = null;

const getDirHandleStorage = () => {
  if (!_dirHandleStorage) {
    _dirHandleStorage = localForage.createInstance({
      driver: localForage.INDEXEDDB,
      name: "markdown-resume-browser",
      storeName: "dir-handles"
    });
  }
  return _dirHandleStorage;
};

const getFileHandleStorage = () => {
  if (!_fileHandleStorage) {
    _fileHandleStorage = localForage.createInstance({
      driver: localForage.INDEXEDDB,
      name: "markdown-resume-browser",
      storeName: "file-handles"
    });
  }
  return _fileHandleStorage;
};

export const useBrowserResumeStore = defineStore("browserResume", () => {
  const resumes = ref<Record<string, ResumeListItem>>({});
  const handleMap = new Map<string, FileSystemFileHandle>();
  const dirHandleMap = new Map<string, FileSystemDirectoryHandle>();

  const resumeList = computed(() => Object.values(resumes.value).sort(sortResumes));

  const findExistingId = async (handle: FileSystemFileHandle) => {
    for (const [id, savedHandle] of handleMap.entries()) {
      try {
        if (await savedHandle.isSameEntry(handle)) return id;
      } catch {
        // Ignore handles that are no longer available
      }
    }

    return null;
  };

  const removeResume = (id: string) => {
    handleMap.delete(id);
    getFileHandleStorage().removeItem(id).catch(() => {});
    deleteStylesCache(id);
    const next = { ...resumes.value };
    delete next[id];
    resumes.value = next;
  };

  const upsertResume = async (handle: FileSystemFileHandle) => {
    if (!isMarkdownFile(handle.name)) return null;

    const existingId = await findExistingId(handle);
    const id = existingId || getBrowserResumeId(`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const created = existingId ? resumes.value[existingId]?.created : undefined;
    const resume = await getResumeFromHandle(id, handle, created);

    handleMap.set(id, handle);
    resumes.value = {
      ...resumes.value,
      [id]: resume
    };

    return resume;
  };

  const getResume = async (id: string): Promise<ResumeStorageItem | null> => {
    if (!handleMap.has(id)) return null;

    try {
      return await refreshResume(id);
    } catch {
      removeResume(id);
      return null;
    }
  };

  const refreshResume = async (id: string): Promise<ResumeListItem | null> => {
    const handle = handleMap.get(id);
    if (!handle) return null;

    try {
      const current = resumes.value[id];
      const resume = await getResumeFromHandle(id, handle, current?.created);
      resumes.value = {
        ...resumes.value,
        [id]: resume
      };

      return resume;
    } catch {
      removeResume(id);
      return null;
    }
  };

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle) => {
    const fileHandles = await collectMarkdownFileHandles(dirHandle);
    for (const fileHandle of fileHandles) {
      await upsertResume(fileHandle);
    }
  };

  const refreshResumes = async () => {
    await Promise.all(resumeList.value.map((resume) => refreshResume(resume.id)));

    // Re-scan stored directories to pick up newly added files
    for (const dirHandle of dirHandleMap.values()) {
      try {
        const perm = await dirHandle.queryPermission({ mode: "read" });
        if (perm !== "granted") continue;
        await scanDirectory(dirHandle);
      } catch {
        // Ignore unavailable directories
      }
    }
  };

  const ensureWritePermission = async (handle: FileSystemFileHandle) => {
    const options = { mode: "readwrite" } as const;

    if ((await handle.queryPermission(options)) === "granted") return true;

    return (await handle.requestPermission(options)) === "granted";
  };

  const saveResume = async (id: string, markdown: string) => {
    const handle = handleMap.get(id);
    if (!handle) return null;

    if (!(await ensureWritePermission(handle))) return null;

    const writable = await handle.createWritable();
    await writable.write(markdown);
    await writable.close();

    return refreshResume(id);
  };

  /**
   * Restore persisted handles from IndexedDB on page load.
   * Handles that still have "granted" permission are loaded immediately.
   * Handles requiring "prompt" are kept in the map for potential later use.
   */
  const initFromStorage = async () => {
    if (!import.meta.client) return;

    // Restore individual file handles
    const fileEntries: Array<[string, StoredFileHandle]> = [];
    await getFileHandleStorage().iterate<StoredFileHandle, void>((value, key) => {
      fileEntries.push([key, value]);
    });

    await Promise.all(
      fileEntries.map(async ([id, stored]) => {
        try {
          const perm = await stored.handle.queryPermission({ mode: "read" });
          if (perm !== "granted") return;
          handleMap.set(id, stored.handle);
          const resume = await getResumeFromHandle(id, stored.handle, stored.created);
          resumes.value = { ...resumes.value, [id]: resume };
        } catch {
          await getFileHandleStorage().removeItem(id);
        }
      })
    );

    // Restore directory handles — scan sequentially so handleMap is fully populated
    // before the next scan starts, preventing duplicate entries from concurrent upserts.
    const dirEntries: Array<[string, FileSystemDirectoryHandle]> = [];
    await getDirHandleStorage().iterate<FileSystemDirectoryHandle, void>((handle, id) => {
      dirEntries.push([id, handle]);
    });

    for (const [id, dirHandle] of dirEntries) {
      try {
        const perm = await dirHandle.queryPermission({ mode: "read" });
        dirHandleMap.set(id, dirHandle);
        if (perm === "granted") await scanDirectory(dirHandle);
      } catch {
        await getDirHandleStorage().removeItem(id);
      }
    }
  };

  const pickFile = async () => {
    if (!isBrowserFileAccessSupported()) {
      return { added: 0, unsupported: true };
    }

    try {
      const handles = await getLocalPickerWindow().showOpenFilePicker?.({
        multiple: false,
        excludeAcceptAllOption: true,
        types: MARKDOWN_PICKER_TYPES
      });

      if (!handles?.length) return { added: 0 };

      let added = 0;

      for (const handle of handles) {
        const resume = await upsertResume(handle);
        if (resume) {
          added += 1;
          await getFileHandleStorage().setItem(resume.id, {
            handle,
            created: resume.created || resume.update
          } as StoredFileHandle);
        }
      }

      return { added };
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return { added: 0, cancelled: true };
      throw error;
    }
  };

  const pickDirectory = async () => {
    if (!isBrowserFileAccessSupported()) {
      return { added: 0, unsupported: true, empty: false };
    }

    try {
      const directoryHandle = await getLocalPickerWindow().showDirectoryPicker?.();
      if (!directoryHandle) return { added: 0, empty: false };

      const handles = await collectMarkdownFileHandles(directoryHandle);
      if (!handles.length) return { added: 0, empty: true };

      // Dedup: if this directory is already tracked, reuse the existing entry
      // instead of storing a second handle that would cause duplicate scans on reload.
      let dirId: string | null = null;
      for (const [existingId, existingHandle] of dirHandleMap.entries()) {
        try {
          if (await existingHandle.isSameEntry(directoryHandle)) {
            dirId = existingId;
            break;
          }
        } catch {
          // stale handle, ignore
        }
      }

      if (!dirId) {
        dirId = `dir__${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        dirHandleMap.set(dirId, directoryHandle);
        await getDirHandleStorage().setItem(dirId, directoryHandle);
      }

      let added = 0;

      for (const handle of handles) {
        if (await upsertResume(handle)) added += 1;
      }

      return { added, empty: false };
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return { added: 0, cancelled: true, empty: false };
      throw error;
    }
  };

  return {
    resumeList,
    getResume,
    refreshResume,
    refreshResumes,
    saveResume,
    pickFile,
    pickDirectory,
    initFromStorage
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useBrowserResumeStore, import.meta.hot));
