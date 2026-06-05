import type { ResumeStyles } from "~/types";

const KEY_PREFIX = "resume-style-cache-";

export const saveStylesCache = (id: string, styles: ResumeStyles) => {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(styles));
  } catch {
    // ignore quota/private-mode errors
  }
};

export const loadStylesCache = (id: string): ResumeStyles | null => {
  if (!import.meta.client) return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as ResumeStyles) : null;
  } catch {
    return null;
  }
};

export const deleteStylesCache = (id: string) => {
  if (!import.meta.client) return;
  localStorage.removeItem(`${KEY_PREFIX}${id}`);
};
