<script setup lang="ts">
import type { BreakpointDef } from '@/core'
import { computed } from 'vue'
import { Tooltip } from '@/components/ui'
import { breakpointRangeLabel, breakpointsInCascadeOrder, breakpointUpperBound } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

interface BreakpointRange {
  id: string
  start: number
  end: number
  direction: BreakpointDef['direction']
  tip: string
}

interface BreakpointHoverZone {
  key: string
  id: string
  start: number
  end: number
  tip: string
}

const props = defineProps<{
  breakpoints: BreakpointDef[]
  /** Cross-highlight: the breakpoint currently hovered anywhere (track or row). */
  hoveredId?: string | null
}>()

const emit = defineEmits<{
  hover: [id: string | null]
}>()

const { t } = useUframeI18n()

// Leave a little room beyond the largest known breakpoint so a `min-width`
// range remains visible instead of ending at the track's edge.
const scaleMax = computed(() => {
  const largest = Math.max(1, ...props.breakpoints.map(breakpointUpperBound))
  return Math.ceil(largest / 200) * 200
})

// Ticks use real media-query boundaries rather than evenly spaced fractions,
// so their distances match the represented resolution intervals.
const rulerTicks = computed(() => {
  const ticks = new Set<number>([0, scaleMax.value])
  for (const breakpoint of props.breakpoints) {
    ticks.add(breakpoint.width)
    if (breakpoint.direction === 'between' && breakpoint.widthMax !== undefined)
      ticks.add(breakpoint.widthMax)
  }
  return [...ticks].sort((a, b) => a - b)
})

// The active breakpoint in an interval is the last matching media rule in the
// cascade. This mirrors the CSS serializer, including overlaps and `between`.
const hoverZones = computed<BreakpointHoverZone[]>(() => {
  const cascade = breakpointsInCascadeOrder(props.breakpoints)
  return rulerTicks.value.flatMap((start, index) => {
    const end = rulerTicks.value[index + 1]
    if (end === undefined || end <= start)
      return []
    const sample = start + (end - start) / 2
    const active = cascade.filter((breakpoint) => {
      if (breakpoint.direction === 'min')
        return sample >= breakpoint.width
      if (breakpoint.direction === 'between')
        return sample >= breakpoint.width && sample <= (breakpoint.widthMax ?? breakpoint.width)
      return sample <= breakpoint.width
    }).at(-1)
    if (!active)
      return []
    return [{
      key: `${start}-${end}`,
      id: active.id,
      start,
      end,
      tip: `${breakpointLabel(active, t)} · ${breakpointRangeLabel(active)}`,
    }]
  })
})

// Each breakpoint owns a separate lane, so overlapping max-width ranges are
// all readable. The bar directly represents its CSS media-query interval.
const ranges = computed<BreakpointRange[]>(() =>
  props.breakpoints
    .slice()
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))
    .map((breakpoint) => {
      const upperBound = breakpointUpperBound(breakpoint)
      const start = breakpoint.direction === 'max' ? 0 : breakpoint.width
      const end = breakpoint.direction === 'min' ? scaleMax.value : upperBound
      return {
        id: breakpoint.id,
        start,
        end,
        direction: breakpoint.direction,
        tip: `${breakpointLabel(breakpoint, t)} · ${breakpointRangeLabel(breakpoint)}`,
      }
    }),
)

function rangeStyle(range: BreakpointRange): Record<string, string> {
  const scale = scaleMax.value
  return {
    left: `${(range.start / scale) * 100}%`,
    width: `${Math.max(1, ((range.end - range.start) / scale) * 100)}%`,
  }
}

function zoneStyle(zone: BreakpointHoverZone): Record<string, string> {
  const scale = scaleMax.value
  return {
    left: `calc(${(zone.start / scale) * 100}% + 1px)`,
    width: `calc(${((zone.end - zone.start) / scale) * 100}% - 2px)`,
  }
}

function rangeColor(direction: BreakpointDef['direction']): string {
  if (direction === 'min')
    return 'bg-uf-symbol/70'
  if (direction === 'between')
    return 'bg-amber-400/70'
  return 'bg-uf-accent/65'
}
</script>

<template>
  <div v-if="ranges.length" class="relative flex flex-col gap-1 select-none">
    <span
      v-for="tick in rulerTicks"
      :key="tick"
      class="pointer-events-none absolute inset-y-0 z-0 border-l border-uf-border/70"
      :style="{ left: `${(tick / scaleMax) * 100}%` }"
    />
    <div
      v-for="range in ranges"
      :key="`${range.id}-highlight`"
      class="pointer-events-none absolute inset-y-0 z-0 transition-colors"
      :class="hoveredId === range.id ? 'bg-uf-accent/8' : ''"
      :style="rangeStyle(range)"
    />
    <Tooltip v-for="zone in hoverZones" :key="zone.key" :text="zone.tip">
      <div
        class="absolute inset-y-0 z-20 cursor-default transition-colors"
        :style="zoneStyle(zone)"
        @mouseenter="emit('hover', zone.id)"
        @mouseleave="emit('hover', null)"
      />
    </Tooltip>
    <div v-for="range in ranges" :key="range.id" class="relative z-10 h-1.5">
      <div
        class="absolute inset-y-0 min-w-0.5 transition-[opacity,box-shadow]"
        :class="[
          rangeColor(range.direction),
          hoveredId === range.id ? 'z-10 opacity-100 contrast-125' : 'opacity-65',
        ]"
        :style="rangeStyle(range)"
      />
    </div>

    <div class="relative h-3 border-t border-uf-border text-[9px] leading-none text-uf-muted tabular-nums">
      <span class="absolute left-1 top-1">0</span>
      <span class="absolute right-1 top-1">{{ scaleMax }}px</span>
    </div>
  </div>
</template>
