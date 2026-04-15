const BROWSER_RESUME_PREFIX = "browser-file__";

export const getBrowserResumeId = (id: string) => `${BROWSER_RESUME_PREFIX}${id}`;

export const parseBrowserResumeId = (id?: string | null) => {
  if (!id || !id.startsWith(BROWSER_RESUME_PREFIX)) return null;
  return id;
};

type LocalPickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandle[]>;
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

export const getLocalPickerWindow = () => window as LocalPickerWindow;

export const isBrowserFileAccessSupported = () =>
  import.meta.client &&
  typeof window !== "undefined" &&
  typeof getLocalPickerWindow().showOpenFilePicker === "function" &&
  typeof getLocalPickerWindow().showDirectoryPicker === "function";
