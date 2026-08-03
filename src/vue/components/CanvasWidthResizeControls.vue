<script setup lang="ts">
import type { CanvasResizeSide } from '@/vue/utils/canvas-width-resize'
import { shallowRef } from 'vue'
import {
  MIN_CANVAS_RESIZE_WIDTH,
  resizeCanvasWidth,
} from '@/vue/utils/canvas-width-resize'

const props = withDefaults(defineProps<{
  width: number
  maxWidth: number
  label: string
  minWidth?: number
  leftInside?: boolean
  rightInside?: boolean
  centered?: boolean
}>(), {
  minWidth: MIN_CANVAS_RESIZE_WIDTH,
  leftInside: false,
  rightInside: false,
  centered: false,
})

const emit = defineEmits<{
  'update:width': [width: number]
  'hover-change': [hovered: boolean]
}>()

interface CanvasWidthDrag {
  pointerId: number
  side: CanvasResizeSide
  startX: number
  startWidth: number
}

const drag = shallowRef<CanvasWidthDrag | null>(null)
const sides: CanvasResizeSide[] = ['left', 'right']
const RESIZE_HANDLE_INSIDE_OFFSET = 4
const RESIZE_HANDLE_OUTSIDE_OFFSET = 8
const RESIZE_HANDLE_HIT_WIDTH = 12
const resizeHandleClass = 'group absolute top-1/2 z-30 h-7 w-[12px] -translate-y-1/2 cursor-col-resize touch-none pointer-events-auto outline-none focus-visible:ring-1 focus-visible:ring-uf-accent'

function isInside(side: CanvasResizeSide): boolean {
  return side === 'left' ? props.leftInside : props.rightInside
}

function resizeHandleStyle(side: CanvasResizeSide) {
  const position = isInside(side) ? 0 : -RESIZE_HANDLE_HIT_WIDTH
  return side === 'left' ? { left: `${position}px` } : { right: `${position}px` }
}

function resizeHandleStripStyle(side: CanvasResizeSide) {
  const offset = isInside(side) ? RESIZE_HANDLE_INSIDE_OFFSET : RESIZE_HANDLE_OUTSIDE_OFFSET
  if (side === 'left')
    return isInside(side) ? { left: `${offset}px` } : { right: `${offset}px` }
  return isInside(side) ? { right: `${offset}px` } : { left: `${offset}px` }
}

function onResizeStart(event: PointerEvent, side: CanvasResizeSide) {
  drag.value = {
    pointerId: event.pointerId,
    side,
    startX: event.clientX,
    startWidth: props.width,
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onResizeMove(event: PointerEvent) {
  const current = drag.value
  if (!current || current.pointerId !== event.pointerId)
    return

  emit('update:width', resizeCanvasWidth({
    side: current.side,
    startX: current.startX,
    currentX: event.clientX,
    startWidth: current.startWidth,
    minWidth: props.minWidth,
    maxWidth: props.maxWidth,
    centered: props.centered,
  }))
}

function onResizeEnd(event: PointerEvent) {
  if (drag.value?.pointerId === event.pointerId)
    drag.value = null
}
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <button
      v-for="side in sides"
      :key="side"
      type="button"
      :class="resizeHandleClass"
      :style="resizeHandleStyle(side)"
      :aria-label="label"
      :data-resize-side="side"
      @pointerdown.prevent.stop="onResizeStart($event, side)"
      @pointermove="onResizeMove"
      @pointerup="onResizeEnd"
      @pointercancel="onResizeEnd"
      @lostpointercapture="onResizeEnd"
      @mouseenter="emit('hover-change', true)"
      @mouseleave="emit('hover-change', false)"
    >
      <span
        :style="resizeHandleStripStyle(side)"
        class="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-uf-muted opacity-60 transition-[background-color,opacity] group-hover:bg-uf-accent group-hover:opacity-100"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
