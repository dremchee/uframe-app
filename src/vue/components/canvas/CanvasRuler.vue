<script setup lang="ts">
import type { BreakpointDef } from '@/core'
import { useEventListener } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  width: number
  breakpoints: BreakpointDef[]
  showBreakpointMarkers?: boolean
  clearRequest?: number
}>()
const emit = defineEmits<{ 'update:guideX': [value: number | null] }>()
const guideX = shallowRef<number | null>(null)
const pinnedGuideX = shallowRef<number | null>(null)
const rulerRef = useTemplateRef<HTMLElement>('rulerRef')

interface RulerTick {
  value: number
  major: boolean
}

interface BreakpointMarker {
  id: string
  position: number
  label: string
}

const majorStep = computed(() => props.width >= 1_000 ? 50 : 25)
const minorStep = computed(() => majorStep.value / 5)
const ticks = computed<RulerTick[]>(() => {
  if (!Number.isFinite(props.width) || props.width <= 0)
    return []

  const end = Math.ceil(props.width / minorStep.value) * minorStep.value
  return Array.from(
    { length: end / minorStep.value + 1 },
    (_, index) => {
      const value = index * minorStep.value
      return { value, major: value % majorStep.value === 0 }
    },
  )
})
const breakpointMarkers = computed<BreakpointMarker[]>(() =>
  props.breakpoints
    .filter(breakpoint => breakpoint.width >= 0 && breakpoint.width <= props.width)
    .map(breakpoint => ({
      id: breakpoint.id,
      position: breakpoint.width,
      label: breakpoint.label || breakpoint.id,
    })),
)
const visibleBreakpointMarkers = computed(() =>
  props.showBreakpointMarkers ? breakpointMarkers.value : [],
)

function guidePosition(event: MouseEvent) {
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return Math.max(0, Math.min(props.width, event.clientX - bounds.left))
}

function setGuide(value: number | null) {
  guideX.value = value
  emit('update:guideX', value)
}

function updateGuide(event: MouseEvent) {
  if (pinnedGuideX.value == null)
    setGuide(guidePosition(event))
}

function pinGuide(event: MouseEvent) {
  const position = guidePosition(event)
  pinnedGuideX.value = position
  setGuide(position)
}

function clearGuide() {
  pinnedGuideX.value = null
  setGuide(null)
}

function clearHoverGuide() {
  if (pinnedGuideX.value == null)
    setGuide(null)
}

watch(() => props.clearRequest, clearGuide)

useEventListener(typeof document === 'undefined' ? undefined : document, 'pointerdown', (event) => {
  if (event.target instanceof Node && !rulerRef.value?.contains(event.target))
    clearGuide()
}, { capture: true })
</script>

<template>
  <div
    ref="rulerRef"
    class="relative h-6 shrink-0 overflow-hidden border-b border-uf-border bg-uf-panel-muted text-uf-muted select-none"
    aria-hidden="true"
    @mousemove="updateGuide"
    @mouseleave="clearHoverGuide"
    @click="pinGuide"
  >
    <span
      v-for="marker in visibleBreakpointMarkers"
      :key="marker.id"
      class="pointer-events-none absolute bottom-1 z-20 size-1.5 -translate-x-1/2 rounded-full bg-uf-accent"
      :style="{ left: `${marker.position}px` }"
      :title="marker.label"
    />
    <span
      v-if="guideX != null"
      class="pointer-events-none absolute inset-y-0 z-10 w-px bg-uf-gap"
      :style="{ left: `${guideX}px` }"
    />
    <span
      v-for="tick in ticks"
      :key="tick.value"
      class="absolute inset-y-0"
      :style="{ left: `${tick.value}px` }"
    >
      <span
        class="absolute bottom-0 border-l border-uf-muted/55"
        :class="tick.major ? 'h-3' : 'h-1.5'"
      />
      <span v-if="tick.major" class="absolute left-1 top-0.5 text-[9px] font-medium leading-none tabular-nums">
        {{ tick.value }}
      </span>
    </span>
  </div>
</template>
