<template>
  <Editable
    v-if="data.curResumeSource === 'local'"
    id="edit-rename"
    class="w-100 mx-2 text-sm md:text-base"
    :default="data.curResumeName"
    :on-value-commit="rename"
  />
  <div v-else class="w-100 mx-2 truncate text-sm md:text-base">
    {{ data.curResumeName }}
    <span v-if="data.curResumeFileName" class="ml-2 text-xs text-light-c">
      {{ data.curResumeFileName }}
    </span>
  </div>
</template>

<script lang="ts" setup>
const { data } = useDataStore();

const rename = (text: string) => {
  data.curResumeName = text;
  renameResume(data.curResumeId!, text);
};
</script>
