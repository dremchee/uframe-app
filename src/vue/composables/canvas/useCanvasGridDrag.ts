import type { Ref } from 'vue'
import type { CanvasGridOptions, GapHandle, SelectedBaseTracks } from './useCanvasGridGeometry'
import type { BlockStyles, GridTrackUnit, PageBlock } from '@/core'
import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import { composeGap, findBlock, formatGridGapSize, formatGridTrackSize, gapAxis, gridTrackUnit, isSplitGap, resizeAdjacentTracks, serializeTrackList } from '@/core'

interface GridDragState {
  axis: 'col' | 'row'
  index: number
  startClient: number
  sizesPx: number[]
  frRatio: number
  pctBase: number
  fontSize: number
  rootFontSize: number
  tracks: { size: string }[]
  blockId: string
}

interface GapDragState {
  axis: 'col' | 'row'
  id: string
  fallbackStyle: Record<string, string>
  startClient: number
  startGapPx: number
  unit: GridTrackUnit
  pctBase: number
  fontSize: number
  rootFontSize: number
  blockId: string
  linked: boolean
}

export interface CanvasGridDragOptions extends CanvasGridOptions {
  selectedBaseTracks: Readonly<Ref<SelectedBaseTracks | null>>
  gridGapHandles: Readonly<Ref<GapHandle[]>>
  flexGapHandles: Readonly<Ref<GapHandle[]>>
  styleWriteTarget: (block: PageBlock, keys: string[]) => { className: string | null, style: BlockStyles }
  writeGestureStyle: (blockId: string, keys: string[], patch: (current: BlockStyles) => BlockStyles) => void
}

/** Owns pointer state and style mutations for grid/flex canvas handles. */
export function useCanvasGridDrag(opts: CanvasGridDragOptions) {
  const {
    editor,
    gridBox,
    flexBox,
    isDragging,
    selectedBaseTracks,
    gridGapHandles,
    flexGapHandles,
    styleWriteTarget,
    writeGestureStyle,
  } = opts

  const gapDrag = shallowRef<GapDragState | null>(null)
  const gapHandles = computed<GapHandle[]>(() => {
    const live = gridGapHandles.value.length ? gridGapHandles.value : flexGapHandles.value
    const drag = gapDrag.value
    if (!drag)
      return live
    const found = live.find(handle => handle.axis === drag.axis && handle.id === drag.id)
    return [{ id: drag.id, axis: drag.axis, style: found?.style ?? drag.fallbackStyle }]
  })

  const flexGapSensors = computed<GapHandle[]>(() => {
    const box = flexBox.value
    if (!box || gapDrag.value || isDragging.value || editor.isPreviewMode.value)
      return []
    if (editor.editBreakpoint.value !== 'base')
      return []
    const MIN = 8
    return box.handles.map((handle, index) => {
      let { left, top, width, height } = handle.band
      if (handle.axis === 'col' && width < MIN) {
        left -= (MIN - width) / 2
        width = MIN
      }
      if (handle.axis === 'row' && height < MIN) {
        top -= (MIN - height) / 2
        height = MIN
      }
      return { id: `fgs-${index}`, axis: handle.axis, style: { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` } }
    })
  })

  const gridDrag = shallowRef<GridDragState | null>(null)
  onScopeDispose(() => {
    if (gridDrag.value || gapDrag.value)
      editor.endTransient()
  })

  function onGridHandleDown(event: PointerEvent, axis: 'col' | 'row', index: number) {
    const box = gridBox.value
    const base = selectedBaseTracks.value
    const id = editor.selectedBlockId.value
    if (!box || !base || !id)
      return
    const sizes = axis === 'col' ? box.columns : box.rows
    const tracks = axis === 'col' ? base.columns : base.rows
    if (sizes.length !== tracks.length)
      return
    event.preventDefault()
    const element = event.target as HTMLElement
    element.setPointerCapture?.(event.pointerId)

    let frPx = 0
    let frVal = 0
    tracks.forEach((track, i) => {
      const match = track.size.match(/^(-?[\d.]+)fr$/)
      if (match) {
        frPx += sizes[i]
        frVal += Number.parseFloat(match[1])
      }
    })
    const gap = axis === 'col' ? box.columnGap : box.rowGap
    const pctBase = sizes.reduce((a, b) => a + b, 0) + Math.max(0, sizes.length - 1) * gap

    editor.beginTransient('history.resizeTracks')
    gridDrag.value = {
      axis,
      index,
      startClient: axis === 'col' ? event.clientX : event.clientY,
      sizesPx: [...sizes],
      frRatio: frVal > 0 ? frPx / frVal : 0,
      pctBase,
      fontSize: box.fontSize,
      rootFontSize: box.rootFontSize,
      tracks: tracks.map(track => ({ ...track })),
      blockId: id,
    }
  }

  const MIN_TRACK_PX = 12
  function onGridHandleMove(event: PointerEvent) {
    const drag = gridDrag.value
    if (!drag)
      return
    const client = drag.axis === 'col' ? event.clientX : event.clientY
    const { aPx, bPx } = resizeAdjacentTracks(drag.sizesPx, drag.index, client - drag.startClient, MIN_TRACK_PX)
    const next = drag.tracks.map((track, index) => {
      if (index === drag.index)
        return { size: formatGridTrackSize(aPx, gridTrackUnit(track.size), drag) }
      if (index === drag.index + 1)
        return { size: formatGridTrackSize(bPx, gridTrackUnit(track.size), drag) }
      return track
    })
    const key = drag.axis === 'col' ? 'gridTemplateColumns' : 'gridTemplateRows'
    writeGestureStyle(drag.blockId, [key], current => ({ ...current, [key]: serializeTrackList(next) }))
  }

  function onGridHandleUp(event: PointerEvent) {
    if (!gridDrag.value)
      return
    const element = event.target as HTMLElement
    element.releasePointerCapture?.(event.pointerId)
    gridDrag.value = null
    editor.endTransient()
  }

  function effGap(style: BlockStyles | undefined, axis: 'col' | 'row'): string {
    return gapAxis(style, axis === 'col' ? 'column' : 'row')
  }

  function writeGap(blockId: string, axis: 'col' | 'row', value: string, linked: boolean) {
    writeGestureStyle(blockId, ['gap'], (current) => {
      const row = linked || axis === 'row' ? value : effGap(current, 'row')
      const col = linked || axis === 'col' ? value : effGap(current, 'col')
      const next: Record<string, unknown> = { ...current, gap: composeGap(row, col, !linked) }
      for (const key of Object.keys(next)) {
        if (next[key] === undefined || next[key] === '')
          delete next[key]
      }
      return next as BlockStyles
    })
  }

  function onGapHandleDown(event: PointerEvent, handle: GapHandle) {
    const grid = gridBox.value
    const flex = flexBox.value
    const box = grid ?? flex
    const id = editor.selectedBlockId.value
    if (!box || !id)
      return
    event.preventDefault()
    const element = event.target as HTMLElement
    element.setPointerCapture?.(event.pointerId)
    const block = findBlock(editor.document.value.blocks, id)
    const axis = handle.axis
    const pctBase = grid
      ? (axis === 'col' ? grid.columns.reduce((a, b) => a + b, 0) + Math.max(0, grid.columns.length - 1) * grid.columnGap : grid.rows.reduce((a, b) => a + b, 0) + Math.max(0, grid.rows.length - 1) * grid.rowGap)
      : (axis === 'col' ? flex!.contentWidth : flex!.contentHeight)
    const authored = block ? styleWriteTarget(block, ['gap']).style : undefined
    editor.beginTransient('history.resizeGap')
    gapDrag.value = {
      axis,
      id: handle.id,
      fallbackStyle: handle.style,
      startClient: axis === 'col' ? event.clientX : event.clientY,
      startGapPx: grid ? (axis === 'col' ? grid.columnGap : grid.rowGap) : (axis === 'col' ? flex!.columnGap : flex!.rowGap),
      unit: gridTrackUnit(effGap(authored, axis)),
      pctBase,
      fontSize: box.fontSize,
      rootFontSize: box.rootFontSize,
      blockId: id,
      linked: !isSplitGap(authored),
    }
  }

  function onGapHandleMove(event: PointerEvent) {
    const drag = gapDrag.value
    if (!drag)
      return
    const client = drag.axis === 'col' ? event.clientX : event.clientY
    writeGap(drag.blockId, drag.axis, formatGridGapSize(drag.startGapPx + (client - drag.startClient), drag.unit, drag), drag.linked)
  }

  function onGapHandleUp(event: PointerEvent) {
    if (!gapDrag.value)
      return
    const element = event.target as HTMLElement
    element.releasePointerCapture?.(event.pointerId)
    gapDrag.value = null
    editor.endTransient()
  }

  const gapHover = ref<'col' | 'row' | null>(null)
  function onGapHandleEnter(axis: 'col' | 'row') {
    gapHover.value = axis
  }
  function onGapHandleLeave() {
    gapHover.value = null
  }

  const gapBands = computed(() => {
    const axis = gapDrag.value?.axis ?? null
    if (!axis)
      return [] as { key: string, style: Record<string, string> }[]
    const out: { key: string, style: Record<string, string> }[] = []
    const grid = gridBox.value
    if (grid) {
      const { rect, offsetLeft, offsetTop, columns, rows, columnGap, rowGap } = grid
      const contentLeft = rect.left + offsetLeft
      const contentTop = rect.top + offsetTop
      const contentWidth = columns.length ? columns.reduce((a, b) => a + b, 0) + (columns.length - 1) * columnGap : rect.width - offsetLeft
      const contentHeight = rows.length ? rows.reduce((a, b) => a + b, 0) + (rows.length - 1) * rowGap : rect.height - offsetTop
      if (axis === 'col' && columnGap > 0) {
        let x = contentLeft
        for (let i = 0; i < columns.length - 1; i++) {
          x += columns[i]
          out.push({ key: `cg-${i}`, style: { left: `${x}px`, top: `${contentTop}px`, width: `${columnGap}px`, height: `${contentHeight}px` } })
          x += columnGap
        }
      }
      else if (axis === 'row' && rowGap > 0) {
        let y = contentTop
        for (let i = 0; i < rows.length - 1; i++) {
          y += rows[i]
          out.push({ key: `rg-${i}`, style: { left: `${contentLeft}px`, top: `${y}px`, width: `${contentWidth}px`, height: `${rowGap}px` } })
          y += rowGap
        }
      }
    }
    const flex = flexBox.value
    if (flex) {
      flex.handles.forEach((handle, index) => {
        if (handle.axis !== axis)
          return
        if ((axis === 'col' ? handle.band.width : handle.band.height) <= 0)
          return
        out.push({ key: `fg-${index}`, style: { left: `${handle.band.left}px`, top: `${handle.band.top}px`, width: `${handle.band.width}px`, height: `${handle.band.height}px` } })
      })
    }
    return out
  })

  return {
    onGridHandleDown,
    onGridHandleMove,
    onGridHandleUp,
    gapHandles,
    flexGapSensors,
    gapBands,
    gapDrag,
    gapHover,
    onGapHandleDown,
    onGapHandleMove,
    onGapHandleUp,
    onGapHandleEnter,
    onGapHandleLeave,
  }
}
