<template>
  <div>
    <div w-56 h-80>
      <div
        class="resume-card group border border-c"
        :style="{
          width: `${width}px`,
          height: `${height}px`
        }"
      >
        <nuxt-link :to="$nuxt.$localePath(`/edit/${props.resume.id}`)">
          <ResumeRender
            :id="renderId"
            ref="render"
            :markdown="resume.markdown"
            :styles="resume.styles"
            :style="{
              transform: `scale(${1 / MM_TO_PX})`
            }"
            class="origin-top-left"
          />
        </nuxt-link>
        <ResumeOptions
          class="group-hover:block hidden"
          :resume="resume"
          @update="emit('update')"
        />
      </div>
    </div>

    <ResumeInfo :resume="resume" @update="emit('update')" />
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

const width = PAPER[props.resume.styles.paper].w;
const height = PAPER[props.resume.styles.paper].h;
const renderId = getResumeRenderId(props.resume.id);

const render = ref();

const updateResumeItem = async () => {
  // set resume backbone styles
  setBackboneCss(props.resume.css, renderId);
  // load Google fonts
  await resolveGoogleFont(props.resume.styles.fontEN);
  await resolveGoogleFont(props.resume.styles.fontCJK);
  // set resume dynamic styles
  setDynamicCss(props.resume.styles, renderId);
  // force update SmartPage
  render.value.forceUpdate();
};

onMounted(updateResumeItem);
onUpdated(updateResumeItem);
</script>
