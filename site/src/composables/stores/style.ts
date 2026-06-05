import { acceptHMRUpdate, defineStore } from "pinia";
import { copy } from "@renovamen/utils";
import type { ResumeStyles, Font } from "~/types";
import { saveStylesCache } from "~/utils/style-cache";

export const useStyleStore = defineStore("style", () => {
  const copiedStyles = copy(DEFAULT_STYLES);
  const styles = reactive<ResumeStyles>(copiedStyles);

  // User-initiated single change — persists the updated styles to localStorage cache
  const setStyle = async <T extends keyof ResumeStyles>(
    key: T,
    value: ResumeStyles[T]
  ) => {
    if (["fontCJK", "fontEN"].includes(key)) await resolveGoogleFont(value as Font);
    styles[key] = value;
    if (!["marginV", "marginH"].includes(key)) setDynamicCss(styles, "preview");

    const { data } = useDataStore();
    if (data.curResumeId) saveStylesCache(data.curResumeId, styles);
  };

  // Batch loading when switching resumes — does NOT write to cache
  const setStyles = async (newStyles: ResumeStyles) => {
    for (const key of Object.keys(newStyles) as Array<keyof ResumeStyles>) {
      if (["fontCJK", "fontEN"].includes(key))
        await resolveGoogleFont(newStyles[key] as Font);
      styles[key as keyof ResumeStyles] = newStyles[key as keyof ResumeStyles];
    }
    setDynamicCss(styles, "preview");
  };

  return {
    styles,
    setStyle,
    setStyles
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useStyleStore, import.meta.hot));
