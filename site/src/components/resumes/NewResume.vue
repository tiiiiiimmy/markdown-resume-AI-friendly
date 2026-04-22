<template>
  <div w-56 flex flex-col gap-2>
    <button
      class="resume-card group w-[210px] h-[299px] flex-center bg-darker-c hover:bg-c"
      :aria-label="$t('resumes.new')"
      @click="newAndSwitch('resume')"
    >
      <span i-ic:round-plus text="5xl light-c group-hover:brand" />
    </button>
    <button
      class="w-[210px] py-1 text-sm text-center text-light-c hover:text-brand transition-colors"
      :aria-label="$t('resumes.new_cover_letter')"
      @click="newAndSwitch('cover-letter')"
    >
      + {{ $t('resumes.new_cover_letter') }}
    </button>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const localePath = useLocalePath();

const newAndSwitch = async (template: "resume" | "cover-letter" = "resume") => {
  const id = await newResume(template);
  router.push(localePath(`/edit/${id}`));
};
</script>
