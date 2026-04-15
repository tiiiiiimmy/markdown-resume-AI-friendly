<template>
  <div class="edit-page flex flex-col">
    <Header>
      <template #middle>
        <RenameResume />
      </template>

      <template #tail>
        <SaveResume />
        <ToggleToolbar
          :is-toolbar-open="isToolbarOpen"
          @toggle-toolbar="isToolbarOpen = !isToolbarOpen"
        />
      </template>
    </Header>

    <div class="workspace size-full overflow-hidden" flex="~ 1" pb-2>
      <div v-bind="api.rootProps" px-3>
        <div class="editor-pane" v-bind="api.getPanelProps({ id: 'editor' })">
          <Editor />
        </div>

        <div v-bind="api.getResizeTriggerProps({ id: 'editor:preview' })" />

        <div class="preview-pane" v-bind="api.getPanelProps({ id: 'preview' })">
          <Preview />
        </div>
      </div>

      <div v-if="isToolbarOpen" class="tools-pane">
        <Toolbar />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as splitter from "@zag-js/splitter";
import { normalizeProps, useMachine } from "@zag-js/vue";
import type { ResumeStorageItem } from "~/types";

// Horizontal splitpane
const [state, send] = useMachine(
  splitter.machine({
    id: "h",
    size: [{ id: "editor" }, { id: "preview" }]
  })
);

const api = computed(() => splitter.connect(state.value, send, normalizeProps));

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { data } = useDataStore();
const browserResumeStore = useBrowserResumeStore();

const applyResume = (id: string, resume: ResumeStorageItem) => {
  setResume(id, resume);
};

const loadCurrentResume = async () => {
  const id = route.params.id as string;
  const browserResumeId = parseBrowserResumeId(id);
  const fileName = parseFileResumeId(id);

  if (browserResumeId) {
    const resume = await browserResumeStore.getResume(browserResumeId);

    if (!resume) {
      useToast().notify(
        "This local Markdown handle is no longer available. Please re-open it from the home page.",
        "error"
      );
      await router.replace(localePath("/"));
      return;
    }

    applyResume(id, resume);
    return;
  }

  if (fileName) {
    const resume = await getFileResume(fileName);
    applyResume(id, resume);
    return;
  }

  await switchResume(id);
};

watch(
  () => route.params.id,
  () => {
    void loadCurrentResume();
  },
  { immediate: true }
);

const hasUnsavedFileChanges = computed(
  () =>
    data.curResumeSource !== "local" &&
    data.mdContent !== data.curResumeFileSyncedContent
);

const syncFileResume = async () => {
  if (data.curResumeSource === "browser-file" && data.curResumeId) {
    const resume = await browserResumeStore.refreshResume(data.curResumeId);

    if (!resume) return;
    if (resume.update === data.curResumeFileUpdate) return;
    if (hasUnsavedFileChanges.value) return;

    applyResume(data.curResumeId, resume);
    return;
  }

  if (data.curResumeSource !== "file" || !data.curResumeFileName) return;

  let resume: ResumeStorageItem;

  try {
    resume = await getFileResume(data.curResumeFileName);
  } catch {
    return;
  }

  if (resume.update === data.curResumeFileUpdate) return;
  if (hasUnsavedFileChanges.value) return;

  applyResume(getFileResumeId(data.curResumeFileName), resume);
};

useIntervalFn(syncFileResume, 1500);

// Toogle toolbar
const { width } = useWindowSize();
const isToolbarOpen = ref(width.value > 1024);
</script>

<style scoped>
[data-scope="splitter"][data-part="resize-trigger"] {
  @apply relative w-3 outline-none;
}

[data-scope="splitter"][data-part="resize-trigger"]::after {
  @apply content-[""] absolute bg-gray-400/40 w-1 h-10 rounded-full inset-0 m-auto;
}
</style>
