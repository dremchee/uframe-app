<script setup lang="ts">
import { computed, toRef } from 'vue'
import CanvasWidthResizeControls from '@/vue/components/CanvasWidthResizeControls.vue'
import { useCanvasContainerPreview } from '@/vue/composables/canvas/useCanvasContainerPreview'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  iframeDoc: Document | null
  iframeWin: Window | null
}>()

const { editor, canvas } = useEditorContext()
const { t } = useUframeI18n()
const preview = canvas.containerPreview
const { rect } = useCanvasContainerPreview({
  editor,
  preview,
  iframeDoc: toRef(props, 'iframeDoc'),
  iframeWin: toRef(props, 'iframeWin'),
})

const outlineStyle = computed(() => {
  const bounds = rect.value
  if (!bounds)
    return undefined
  return {
    top: `${bounds.top}px`,
    left: `${bounds.left}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    boxShadow: '0 0 0 100vmax rgba(2,6,23,0.55)',
  }
})

const maxResizeWidth = computed(() => {
  const bounds = rect.value
  const win = props.iframeWin
  if (!bounds || !win)
    return 0
  const center = bounds.left + bounds.width / 2
  return Math.max(0, 2 * Math.min(center, win.innerWidth - center))
})

const widthLabelStyle = computed(() => {
  const bounds = rect.value
  if (!bounds)
    return undefined
  return {
    top: `${Math.max(5, bounds.top + 5)}px`,
    left: `${bounds.left + bounds.width - 5}px`,
    transform: 'translateX(-100%)',
    width: 'max-content',
    whiteSpace: 'nowrap',
  }
})

const widthLabel = computed(() =>
  preview.width.value == null ? '' : `${preview.width.value}\u00A0px`,
)
</script>

<template>
  <template v-if="rect && preview.blockId.value">
    <div
      class="absolute z-20 pointer-events-none rounded-[2px] border border-dashed border-uf-accent/80 transition-[background-color,border-color]"
      :class="preview.highlighted.value && 'border-solid border-2 border-uf-accent bg-uf-accent/10'"
      :style="outlineStyle"
    >
      <CanvasWidthResizeControls
        :width="rect.width"
        :max-width="maxResizeWidth"
        left-inside
        right-inside
        centered
        :label="t('canvas.resizeContainer')"
        @update:width="preview.setOverrideWidth"
      />
    </div>
    <output
      v-if="preview.width.value != null"
      class="absolute z-30 pointer-events-none whitespace-nowrap rounded-sm bg-uf-accent px-1.5 py-1 text-[10px] font-semibold tabular-nums leading-none text-uf-accent-foreground"
      :style="widthLabelStyle"
      :aria-label="t('style.currentContainerWidth', { width: preview.width.value })"
    >
      {{ widthLabel }}
    </output>
  </template>
</template>
