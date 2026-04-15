<template>
  <button class="round-btn" @click="save">
    <span i-ic:baseline-save md:text-lg />
  </button>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@renovamen/vue-shortcuts";
import type { ResumeStorageItem } from "~/types";

const { data, setData } = useDataStore();
const { styles } = useStyleStore();
const toast = useToast();

const save = async () => {
  if (data.curResumeSource === "file" && data.curResumeFileName) {
    const resume = await saveFileResume(data.curResumeFileName, data.mdContent);
    setData("curResumeFileUpdate", resume.update);
    setData("curResumeFileSyncedContent", resume.markdown);
    toast.save();
    return;
  }

  const id = data.curResumeId;
  const update = new Date().getTime().toString(); // record update time
  const resume = {
    name: data.curResumeName,
    markdown: data.mdContent,
    css: data.cssContent,
    styles: toRaw(styles),
    created: id!,
    source: "local",
    update: update
  } as ResumeStorageItem;

  await saveResume(id!, resume);
};

useShortcuts("ctrl+s", save);
</script>
