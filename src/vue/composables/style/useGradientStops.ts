import type { Ref } from 'vue'
import type { GradientValue } from '@/core'
import { computed, shallowRef } from 'vue'
import { parseLength } from '@/components/ui'
import { insertListItem, removeListItem, replaceListItem } from '@/core'

export interface UseGradientStopsOptions {
  gradient: Readonly<Ref<GradientValue>>
  track: Readonly<Ref<HTMLElement | null>>
  update: (value: GradientValue) => void
}

/**
 * Keeps the gradient-stop editor's list mutations and pointer-drag state out
 * of the presentational gradient component. The caller remains the single
 * owner of the GradientValue and receives every completed replacement.
 */
export function useGradientStops(options: UseGradientStopsOptions) {
  const { gradient, track, update } = options
  const selectedStop = shallowRef(0)
  const activeStop = computed(() => Math.min(selectedStop.value, gradient.value.stops.length - 1))
  let draggingStop = -1
  let lastClickIndex = -1
  let lastClickTime = 0
  let movedThisDrag = false

  function setStopColor(index: number, color: string) {
    const current = gradient.value
    const stop = current.stops[index]
    if (stop)
      update({ ...current, stops: replaceListItem(current.stops, index, { ...stop, color: color || '#000000' }) })
  }

  function setStopPositionNumber(index: number, position: number, clampToNeighbors = false) {
    const current = gradient.value
    if (index < 0 || index >= current.stops.length)
      return
    let clamped = Math.min(100, Math.max(0, Math.round(position)))
    if (clampToNeighbors) {
      const lower = index > 0 ? current.stops[index - 1].position : 0
      const upper = index < current.stops.length - 1 ? current.stops[index + 1].position : 100
      clamped = Math.min(upper, Math.max(lower, clamped))
    }
    update({ ...current, stops: replaceListItem(current.stops, index, { ...current.stops[index]!, position: clamped }) })
  }

  function setStopPosition(index: number, value: string) {
    const parsed = parseLength(value)
    const position = parsed ? Number.parseFloat(parsed.number) : Number.NaN
    if (Number.isFinite(position))
      setStopPositionNumber(index, position)
  }

  function sortStops() {
    const current = gradient.value
    const sorted = [...current.stops].sort((left, right) => left.position - right.position)
    if (sorted.some((stop, index) => stop !== current.stops[index]))
      update({ ...current, stops: sorted })
  }

  function positionFromEvent(event: PointerEvent): number {
    const rect = track.value?.getBoundingClientRect()
    if (!rect?.width)
      return 0
    return Math.round(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * 100)
  }

  function addStopAt(position: number): number {
    const current = gradient.value
    const nearest = current.stops.reduce(
      (left, right) => (Math.abs(right.position - position) < Math.abs(left.position - position) ? right : left),
      current.stops[0],
    )
    let at = current.stops.findIndex(stop => stop.position > position)
    if (at < 0)
      at = current.stops.length
    const stops = insertListItem(current.stops, at, { id: `gs-${at}`, color: nearest?.color ?? '#ffffff', position })
    update({ ...current, stops })
    return at
  }

  function addStop() {
    const current = gradient.value
    const last = current.stops[current.stops.length - 1]
    const previous = current.stops[current.stops.length - 2]
    const position = previous ? Math.round((previous.position + last.position) / 2) : 50
    selectedStop.value = addStopAt(position)
  }

  function removeStop(index: number) {
    const current = gradient.value
    if (current.stops.length <= 2)
      return
    if (selectedStop.value >= index && selectedStop.value > 0)
      selectedStop.value -= 1
    update({ ...current, stops: removeListItem(current.stops, index) })
  }

  function duplicateStop(index: number): number {
    const current = gradient.value
    const original = current.stops[index]
    if (!original)
      return index
    const rightRoom = (index < current.stops.length - 1 ? current.stops[index + 1].position : 100) - original.position
    const leftRoom = original.position - (index > 0 ? current.stops[index - 1].position : 0)
    const at = rightRoom >= leftRoom ? index + 1 : index
    const stops = insertListItem(current.stops, at, { id: `gs-${at}`, color: original.color, position: original.position })
    update({ ...current, stops })
    return at
  }

  function onHandlePointerDown(index: number, event: PointerEvent) {
    if (event.button !== 0)
      return
    if (index === lastClickIndex && event.timeStamp - lastClickTime < 350) {
      lastClickIndex = -1
      removeStop(index)
      return
    }
    lastClickIndex = index
    lastClickTime = event.timeStamp
    movedThisDrag = false
    draggingStop = event.altKey ? duplicateStop(index) : index
    selectedStop.value = draggingStop
    track.value?.setPointerCapture(event.pointerId)
  }

  function onTrackPointerDown(event: PointerEvent) {
    if (event.button !== 0)
      return
    lastClickIndex = -1
    draggingStop = addStopAt(positionFromEvent(event))
    selectedStop.value = draggingStop
    track.value?.setPointerCapture(event.pointerId)
  }

  function onTrackPointerMove(event: PointerEvent) {
    if (draggingStop < 0)
      return
    movedThisDrag = true
    setStopPositionNumber(draggingStop, positionFromEvent(event), true)
  }

  function onTrackPointerUp(event: PointerEvent) {
    if (draggingStop < 0)
      return
    if (movedThisDrag)
      lastClickIndex = -1
    draggingStop = -1
    track.value?.releasePointerCapture?.(event.pointerId)
  }

  return {
    activeStop,
    selectedStop,
    setStopColor,
    setStopPosition,
    sortStops,
    addStop,
    removeStop,
    onHandlePointerDown,
    onTrackPointerDown,
    onTrackPointerMove,
    onTrackPointerUp,
  }
}
