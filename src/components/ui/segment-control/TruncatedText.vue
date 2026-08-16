<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import Tooltip from '@/components/ui/tooltip/Tooltip.vue'

const props = defineProps<{
  text: string
}>()

const textEl = useTemplateRef<HTMLSpanElement>('textEl')
const isTruncated = shallowRef(false)
let observer: ResizeObserver | undefined

function measure() {
  const element = textEl.value
  isTruncated.value = !!element && element.scrollWidth > element.clientWidth
}

function scheduleMeasure() {
  void nextTick(measure)
}

onMounted(() => {
  scheduleMeasure()
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', scheduleMeasure)
    return
  }
  observer = new ResizeObserver(scheduleMeasure)
  if (textEl.value)
    observer.observe(textEl.value)
})

watch(() => props.text, scheduleMeasure)

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', scheduleMeasure)
})
</script>

<template>
  <Tooltip :text="text" :open="isTruncated ? undefined : false">
    <span ref="textEl" class="block min-w-0 truncate">{{ text }}</span>
  </Tooltip>
</template>
