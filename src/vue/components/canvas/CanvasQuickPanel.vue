<script setup lang="ts">
import { ChevronDown, ChevronUp, GripHorizontal, X } from '@lucide/vue'
import { computed, nextTick, useTemplateRef } from 'vue'
import { IconButton, Tooltip } from '@/components/ui'
import { isComboKey, parseClassKey } from '@/core'
import { useCanvasAnchoredPanel } from '@/vue/composables/canvas/useCanvasAnchoredPanel'
import { useStyleTarget } from '@/vue/composables/style/useStyleTarget'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { displayBlockLabel } from '@/vue/utils/block-label'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

/**
 * The selected block's quick panel, floating next to it on the canvas. It is
 * the same component the properties panel shows in its Quick layout section,
 * bound to the same shared style target — so the two never disagree about the
 * class, breakpoint or state an edit lands in. Opened from the selection
 * badge; the open / expanded flags persist in the editor prefs.
 */
const { editor, canvas } = useEditorContext()
const { block, blockSlice, editingTarget, viewport, styleState } = useStyleTarget()
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
const editingContext = computed(() => {
  const target = editingTarget.value
  const targetLabel = target.kind === 'class'
    ? isComboKey(target.name)
      ? t('properties.combo', { names: parseClassKey(target.name).join(' + ') })
      : t('properties.class', { name: target.name })
    : target.kind === 'page' ? t('properties.page') : t('properties.block', { type: label.value })
  const breakpoint = editor.breakpoints.value.find(item => item.id === viewport.value)
  // State slices currently apply at every width, independently of the viewport.
  const widthLabel = styleState.value !== 'default' || viewport.value === 'base'
    ? t('style.allWidths')
    : breakpoint ? breakpointLabel(breakpoint, t) : viewport.value
  const stateKeys = { default: 'stateDefault', hover: 'stateHover', focus: 'stateFocus', active: 'stateActive' }
  return `${targetLabel} · ${widthLabel} · ${t(`style.${stateKeys[styleState.value]}`)}`
})

const { style, docked, onHandlePointerDown } = useCanvasAnchoredPanel({
  canvas,
  preferredSize: computed(() => expanded.value ? { width: 320, height: 430 } : { width: 520, height: 200 }),
  panelRef,
  resetKey: computed(() => block.value?.id),
})

async function close() {
  editor.storage.value.quickPanelOpen = false
  await nextTick()
  canvas.paneEl.value?.querySelector<HTMLElement>('[data-uf-quick-panel-trigger]')?.focus()
}
</script>

<template>
  <div
    v-if="open"
    ref="panelRef"
    class="uf-overlay fixed z-40 overflow-auto flex flex-col gap-2 rounded-lg border border-uf-border bg-uf-panel p-2 text-uf-text shadow-pb"
    :class="expanded && !docked ? 'w-80' : 'w-[520px]'"
    :style="style"
    role="dialog"
    :aria-label="t('canvas.quickPanel')"
    @keydown.esc.stop.prevent="close"
  >
    <header
      class="flex cursor-grab items-center gap-1.5 select-none active:cursor-grabbing"
      :title="t('canvas.dragPanel')"
      @pointerdown="onHandlePointerDown"
    >
      <GripHorizontal :size="14" :stroke-width="1.75" class="shrink-0 text-uf-muted" aria-hidden="true" />
      <span class="min-w-0 truncate text-[11px] font-semibold">{{ label }}</span>
      <span class="flex-1" />
      <Tooltip v-if="!docked" :text="expanded ? t('canvas.collapseQuickPanel') : t('canvas.expandQuickPanel')">
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
    <p class="min-w-0 break-words text-[11px] leading-snug text-uf-muted" aria-live="polite">
      {{ editingContext }}
    </p>
    <p v-if="docked" class="text-[11px] text-uf-muted">
      {{ t('canvas.panelDocked') }}
    </p>
    <component :is="quickPanel" v-model="blockSlice" :block="block" :compact="!expanded || docked" />
  </div>
</template>
