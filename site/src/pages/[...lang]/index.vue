<template>
  <div class="resumes-page">
    <Header />

    <div class="max-w-306 mx-auto px-5 py-16 text-dark-c">
      <div class="space-y-2 md:(hstack justify-between)">
        <h1 font-bold text-3xl>{{ $t("resumes.my_resumes") }}</h1>
        <FileOptions @update="loadResumes" />
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-8 mt-8">
        <NewResume />
        <ResumeItem
          v-for="resume in list"
          :key="resume.id"
          class="resume-item"
          :resume="resume"
          @update="loadResumes"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ResumeListItem } from "~/types";

const browserResumeStore = useBrowserResumeStore();
const localResumes = ref<ResumeListItem[]>([]);
const fileResumes = ref<ResumeListItem[]>([]);

const list = computed(() =>
  [...browserResumeStore.resumeList, ...fileResumes.value, ...localResumes.value].sort((a, b) =>
    (b.update || b.id).localeCompare(a.update || a.id)
  )
);

const loadResumes = async () => {
  const [nextLocalResumes, nextFileResumes] = await Promise.all([
    getResumeList(),
    getFileResumeList()
  ]);

  localResumes.value = nextLocalResumes;
  fileResumes.value = nextFileResumes;
};

onMounted(loadResumes);

useIntervalFn(async () => {
  await browserResumeStore.refreshResumes();
}, 1500);
</script>
