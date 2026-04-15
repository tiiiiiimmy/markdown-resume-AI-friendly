<template>
  <div class="file-options hstack space-x-2">
    <button aria-label="Open local Markdown file" @click="openLocalMd">
      <span i-ic:round-note-add text-lg />
      <span>Open MD</span>
    </button>
    <button aria-label="Open local Markdown folder" @click="openLocalFolder">
      <span i-ic:round-folder-open text-lg />
      <span>Open Folder</span>
    </button>
    <button :aria-label="$t('resumes.saveas')" @click="saveResumesToLocal">
      <span i-ic:baseline-save-as text-lg />
      <span>{{ $t("resumes.saveas") }}</span>
    </button>
    <button
      :aria-label="$t('resumes.import')"
      @click="() => importResumesFromLocal(() => $emit('update'))"
    >
      <span i-ic:round-upload-file text-lg />
      <span>{{ $t("resumes.import") }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useShortcuts } from "@renovamen/vue-shortcuts";

const emit = defineEmits<{
  (e: "update"): void;
}>();

const toast = useToast();
const browserResumeStore = useBrowserResumeStore();

const showUnsupportedMessage = () => {
  toast.notify(
    "Local file access requires a Chromium browser on HTTPS or localhost.",
    "error"
  );
};

const openLocalMd = async () => {
  const result = await browserResumeStore.pickFile();

  if (result.unsupported) {
    showUnsupportedMessage();
    return;
  }

  if (result.added) {
    emit("update");
    toast.notify("Loaded the selected Markdown file.", "success");
  }
};

const openLocalFolder = async () => {
  const result = await browserResumeStore.pickDirectory();

  if (result.unsupported) {
    showUnsupportedMessage();
    return;
  }

  if (result.empty) {
    toast.notify("No Markdown files were found in the selected folder.", "error");
    return;
  }

  if (result.added) {
    emit("update");
    toast.notify(`Loaded ${result.added} Markdown file${result.added > 1 ? "s" : ""}.`, "success");
  }
};

useShortcuts("shift+ctrl+s", saveResumesToLocal);
</script>

<style scoped>
.file-options button {
  @apply rect-btn border border-dark-c hover:bg-darker-c;
}
</style>
