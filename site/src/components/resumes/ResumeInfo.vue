<template>
  <div text-center>
    <Editable
      v-if="resume.source !== 'file'"
      :id="`resumes-rename-${resume.id}`"
      class="w-53 mx-auto"
      :default="resume.name"
      :on-value-commit="rename"
    />
    <div v-else class="w-53 mx-auto truncate">{{ resume.name }}</div>
    <div v-if="updated" text-xs text-light-c mt-1.5>
      {{ $t("resumes.updated") }}{{ updated }}
    </div>
    <div text-xs text-light-c mt-0.5>{{ $t("resumes.created") }}{{ created }}</div>
    <div v-if="resume.source === 'file' && resume.fileName" text-xs text-light-c mt-0.5>
      {{ resume.fileName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ResumeListItem } from "~/types";

const props = defineProps<{
  resume: ResumeListItem;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const rename = async (text: string) => {
  if (props.resume.source === "file") return;
  await renameResume(props.resume.id, text);
  emit("update");
};

const formatDate = (date?: string) => {
  if (!date) return;

  const parsed = Number.parseInt(date);
  if (Number.isNaN(parsed)) return;

  return (
    new Date(parsed)
      .toISOString()
      .substring(0, 19)
      .replace("T", " ")
      .replaceAll("-", "/")
  );
};

const created = computed(() => formatDate(props.resume.created || props.resume.id));
const updated = computed(() => formatDate(props.resume.update));
</script>
