import { basename, extname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createError } from "h3";
import { DEFAULT_CSS_CONTENT, DEFAULT_STYLES } from "../../utils/constants/default";
import type { ResumeListItem, ResumeStorageItem } from "../../types";

const getFileResumeId = (fileName: string) => fileName;

const getResumeDir = () => {
  const candidates = [resolve(process.cwd(), "resume"), resolve(process.cwd(), "..", "resume")];
  const existing = candidates.find((dir) => existsSync(dir));
  return existing || candidates[0];
};

const ensureResumeDir = async () => {
  const resumeDir = getResumeDir();
  await mkdir(resumeDir, { recursive: true });
  return resumeDir;
};

const normalizeFileName = (fileName?: string | null) => {
  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing resume file name"
    });
  }

  const decoded = decodeURIComponent(fileName);

  if (
    decoded.includes("/") ||
    decoded.includes("\\") ||
    decoded.includes("..") ||
    extname(decoded).toLowerCase() !== ".md"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid resume file name"
    });
  }

  return decoded;
};

const toResumeItem = async (fileName: string): Promise<ResumeListItem> => {
  const resumeDir = await ensureResumeDir();
  const filePath = resolve(resumeDir, fileName);
  const [markdown, stats] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
  const created = String(Math.floor(stats.birthtimeMs || stats.mtimeMs));
  const update = String(Math.floor(stats.mtimeMs));

  return {
    id: getFileResumeId(fileName),
    name: basename(fileName, ".md"),
    markdown,
    css: DEFAULT_CSS_CONTENT,
    styles: DEFAULT_STYLES,
    source: "file",
    fileName,
    created,
    update
  };
};

export const listResumeFiles = async () => {
  const resumeDir = await ensureResumeDir();
  const entries = await readdir(resumeDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
    .map((entry) => entry.name);

  const items = await Promise.all(files.map((fileName) => toResumeItem(fileName)));
  return items.sort((a, b) => b.update.localeCompare(a.update));
};

export const readResumeFile = async (fileName: string): Promise<ResumeStorageItem> => {
  const normalized = normalizeFileName(fileName);

  try {
    return await toResumeItem(normalized);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw createError({
        statusCode: 404,
        statusMessage: `Resume file "${normalized}" not found`
      });
    }

    throw error;
  }
};

export const writeResumeFile = async (fileName: string, markdown: string) => {
  const normalized = normalizeFileName(fileName);
  const resumeDir = await ensureResumeDir();
  const filePath = resolve(resumeDir, normalized);

  await writeFile(filePath, markdown, "utf8");

  return readResumeFile(normalized);
};
