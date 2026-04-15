import type { ResumeListItem, ResumeStorageItem } from "~/types";

const getResumeFilesApiBase = () => {
  const baseURL = useRuntimeConfig().app.baseURL || "/";
  return `${baseURL.replace(/\/$/, "")}/api/resume-files`;
};

export const getFileResumeId = (fileName: string) => fileName;

export const getResumeRenderId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_");

export const parseFileResumeId = (id?: string | null) => {
  if (!id || !id.toLowerCase().endsWith(".md")) return null;
  return id;
};

export const getFileResumeList = async () => {
  try {
    const res = await $fetch<{ items: ResumeListItem[] }>(getResumeFilesApiBase());
    return res.items;
  } catch {
    return [];
  }
};

export const getFileResume = async (fileName: string) =>
  $fetch<ResumeStorageItem>(`${getResumeFilesApiBase()}/${encodeURIComponent(fileName)}`);

export const saveFileResume = async (fileName: string, markdown: string) =>
  $fetch<ResumeStorageItem>(`${getResumeFilesApiBase()}/${encodeURIComponent(fileName)}`, {
    method: "PUT",
    body: { markdown }
  });
