<script setup lang="ts">
import type { BaseBlockStyles, CssLength } from '@/core'
import { onBeforeUnmount, ref } from 'vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import SpacingField from './SpacingField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()

type Group = 'margin' | 'padding'
type Side = 'Top' | 'Right' | 'Bottom' | 'Left'

// Edge placement, shared by the outer (margin) and inner (padding) frames. The
// wrapper is positioned; the field's small trigger centres within the gutter.
const edges: Array<{ side: Side, pos: string, dir: 'up' | 'down' | 'left' | 'right' }> = [
  { side: 'Top', pos: 'top-0.5 left-1/2 -translate-x-1/2', dir: 'up' },
  { side: 'Right', pos: 'right-0.5 top-1/2 -translate-y-1/2', dir: 'right' },
  { side: 'Bottom', pos: 'bottom-0.5 left-1/2 -translate-x-1/2', dir: 'down' },
  { side: 'Left', pos: 'left-0.5 top-1/2 -translate-y-1/2', dir: 'left' },
]

function styleKey(group: Group, side: Side): keyof BaseBlockStyles {
  return `${group}${side}` as keyof BaseBlockStyles
}
function get(group: Group, side: Side): string {
  return (props.modelValue[styleKey(group, side)] as CssLength | undefined) ?? ''
}
function set(group: Group, side: Side, value: string) {
  const next: BaseBlockStyles = { ...props.modelValue }
  const key = styleKey(group, side)
  if (value === '')
    delete next[key]
  else
    (next as Record<string, CssLength>)[key] = value
  emit('update:modelValue', next)
}

// Key of the field whose popover is open, so the rest of the box can dim while
// the active trigger stays lifted above the shade.
const open = ref<string | null>(null)
// Key of the field currently being scrub-dragged. Mutually exclusive with
// `open` (drag suppresses the trailing click that would open the popover),
// but tracked separately so the popover spotlight only follows `open`.
const dragging = ref<string | null>(null)
// Key of the field merely hovered — lowest priority, so it previews the band on
// the canvas only when nothing is open or being dragged.
const hovering = ref<string | null>(null)

function activeKey(): string | null {
  return open.value ?? dragging.value ?? hovering.value
}

function syncOverlay() {
  const key = activeKey()
  if (!key) {
    editor.setSpacingOverlay(null)
    return
  }
  const [prefix, side] = key.split('-')
  editor.setSpacingOverlay({
    group: prefix === 'm' ? 'margin' : 'padding',
    side: side as 'Top' | 'Right' | 'Bottom' | 'Left',
  })
}

function setOpen(key: string, isOpen: boolean) {
  open.value = isOpen ? key : (open.value === key ? null : open.value)
  syncOverlay()
}

function setDragging(key: string, isDragging: boolean) {
  const wasDragging = dragging.value !== null
  dragging.value = isDragging ? key : (dragging.value === key ? null : dragging.value)
  const isDraggingNow = dragging.value !== null
  // Open a single history-coalescing window for the whole scrub. Closing it on
  // drag-end lands one undo entry per gesture instead of one per frame.
  if (!wasDragging && isDraggingNow)
    editor.beginTransient('history.spacing')
  else if (wasDragging && !isDraggingNow)
    editor.endTransient()
  syncOverlay()
}

function setHovering(key: string, isHovering: boolean) {
  hovering.value = isHovering ? key : (hovering.value === key ? null : hovering.value)
  syncOverlay()
}

onBeforeUnmount(() => {
  editor.setSpacingOverlay(null)
  // Defensive: if the component unmounts mid-gesture (e.g. the selected block
  // is removed during a drag), close the transient window so future commits
  // don't quietly skip history.
  if (dragging.value !== null)
    editor.endTransient()
})

const frame = 'relative rounded-md transition-colors'
const labelText = 'absolute top-1 left-2 text-[10px] font-semibold uppercase tracking-wide text-uf-muted pointer-events-none'
</script>

<template>
  <div class="border border-uf-border bg-uf-panel-muted px-10 py-7" :class="[frame]">
    <span :class="labelText">{{ t('style.margin') }}</span>
    <div
      v-for="edge in edges"
      :key="`m-${edge.side}`"
      class="absolute"
      :class="[edge.pos, open === `m-${edge.side}` && 'z-20']"
      @mouseenter="setHovering(`m-${edge.side}`, true)"
      @mouseleave="setHovering(`m-${edge.side}`, false)"
    >
      <SpacingField
        :model-value="get('margin', edge.side)"
        :dir="edge.dir"
        :label="`Margin ${edge.side}`"
        @change="value => set('margin', edge.side, value)"
        @update:open="value => setOpen(`m-${edge.side}`, value)"
        @update:dragging="value => setDragging(`m-${edge.side}`, value)"
      />
    </div>

    <div class="border border-uf-border bg-uf-panel px-10 py-7" :class="[frame]">
      <span :class="labelText">{{ t('style.padding') }}</span>
      <div
        v-for="edge in edges"
        :key="`p-${edge.side}`"
        class="absolute"
        :class="[edge.pos, open === `p-${edge.side}` && 'z-20']"
        @mouseenter="setHovering(`p-${edge.side}`, true)"
        @mouseleave="setHovering(`p-${edge.side}`, false)"
      >
        <SpacingField
          :model-value="get('padding', edge.side)"
          :dir="edge.dir"
          :label="`Padding ${edge.side}`"
          @change="value => set('padding', edge.side, value)"
          @update:open="value => setOpen(`p-${edge.side}`, value)"
          @update:dragging="value => setDragging(`p-${edge.side}`, value)"
        />
      </div>
      <div class="h-7 rounded bg-uf-border/40" aria-hidden="true" />
    </div>

    <!-- Spotlight: shade the whole control while a popover is open; the active
         trigger is lifted above this overlay (z-20) so it stays crisp. -->
    <div
      v-if="open"
      class="absolute inset-0 z-10 rounded-md bg-black/10 pointer-events-none transition-opacity"
      aria-hidden="true"
    />
  </div>
</template>
