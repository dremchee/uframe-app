<script setup lang="ts">
import { ChevronDown, ChevronUp, GripHorizontal, X } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { IconButton, Tooltip } from '@/components/ui'
import { useCanvasAnchoredPanel } from '@/vue/composables/canvas/useCanvasAnchoredPanel'
import { useStyleTarget } from '@/vue/composables/style/useStyleTarget'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { displayBlockLabel } from '@/vue/utils/block-label'

/**
 * The selected block's quick panel, floating next to it on the canvas. It is
 * the same component the properties panel shows in its Quick layout section,
 * bound to the same shared style target — so the two never disagree about the
 * class, breakpoint or state an edit lands in. Opened from the selection
 * badge; the open / expanded flags persist in the editor prefs.
 */
const { editor, canvas } = useEditorContext()
const { block, blockSlice } = useStyleTarget()
const { t } = useUframeI18n()
const panelRef = useTemplateRef<HTMLElement>('panelRef')

const definition = computed(() => (block.value ? editor.registry.value[block.value.type] : undefined))
const quickPanel = computed(() => definition.value?.quickPanel)
const open = computed(() =>
  editor.storage.value.quickPanelOpen
  && !!block.value
  && !!quickPanel.value
  && !canvas.busy.value,
)
const expanded = computed({
  get: () => editor.storage.value.quickPanelExpanded,
  set: (value: boolean) => {
    editor.storage.value.quickPanelExpanded = value
  },
})
const label = computed(() => (block.value ? displayBlockLabel(block.value, definition.value, t) : ''))

const { style, onHandlePointerDown } = useCanvasAnchoredPanel({
  canvas,
  panelRef,
  resetKey: computed(() => block.value?.id),
})

function close() {
  editor.storage.value.quickPanelOpen = false
}
</script>

<template>
  <div
    v-if="open"
    ref="panelRef"
    class="uf-overlay fixed z-40 flex flex-col gap-2 rounded-lg border border-uf-border bg-uf-panel p-2 text-uf-text shadow-pb"
    :class="expanded ? 'w-80' : 'max-w-[min(600px,calc(100vw-32px))]'"
    :style="style"
    role="dialog"
    :aria-label="t('canvas.quickPanel')"
  >
    <header
      class="flex cursor-grab items-center gap-1.5 select-none active:cursor-grabbing"
      :title="t('canvas.dragPanel')"
      @pointerdown="onHandlePointerDown"
    >
      <GripHorizontal :size="14" :stroke-width="1.75" class="shrink-0 text-uf-muted" aria-hidden="true" />
      <span class="min-w-0 truncate text-[11px] font-semibold">{{ label }}</span>
      <span class="flex-1" />
      <Tooltip :text="expanded ? t('canvas.collapseQuickPanel') : t('canvas.expandQuickPanel')">
        <IconButton size="sm" :aria-label="expanded ? t('canvas.collapseQuickPanel') : t('canvas.expandQuickPanel')" @click="expanded = !expanded">
          <component :is="expanded ? ChevronUp : ChevronDown" :size="14" :stroke-width="1.75" />
        </IconButton>
      </Tooltip>
      <Tooltip :text="t('canvas.hideQuickPanel')">
        <IconButton size="sm" :aria-label="t('canvas.hideQuickPanel')" @click="close">
          <X :size="14" :stroke-width="1.75" />
        </IconButton>
      </Tooltip>
    </header>
    <component :is="quickPanel" v-model="blockSlice" :block="block" :compact="!expanded" />
  </div>
</template>
