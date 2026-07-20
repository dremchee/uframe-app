import type { Ref } from 'vue'
import type { FlexBox, GridBox } from './canvas-overlay-types'
import type { BlockStyles, GridTrack, PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { classKeyApplies, findBlock, isComboKey, parseClassKey, parseTrackList } from '@/core'
import { buildGridGuides } from '@/vue/utils/canvas-grid'

export interface CanvasGridOptions {
  editor: PageEditorInstance
  gridBox: Ref<GridBox | null>
  flexBox: Ref<FlexBox | null>
  isDragging: Ref<boolean>
}

export interface GridHandle {
  key: string
  axis: 'col' | 'row'
  index: number
  style: Record<string, string>
}

export interface GapHandle {
  id: string
  axis: 'col' | 'row'
  style: Record<string, string>
}

export interface SelectedBaseTracks {
  columns: GridTrack[]
  rows: GridTrack[]
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

/** Computes canvas grid/flex guides and the stable handles used by drag logic. */
export function useCanvasGridGeometry(opts: CanvasGridOptions) {
  const { editor, gridBox, flexBox, isDragging } = opts

  const gridGuides = computed(() => {
    const box = gridBox.value
    if (!box || isDragging.value || editor.isPreviewMode.value)
      return null
    return buildGridGuides(box)
  })

  // Class-first authoring mirrors the properties panel: gestures update the
  // class that currently supplies a property instead of creating local noise.
  function styleWriteTarget(block: PageBlock, keys: string[]): { className: string | null, style: BlockStyles } {
    const local = (block.style ?? {}) as Record<string, unknown>
    const classes = block.classes ?? []
    if (!classes.length || keys.some(key => local[key] !== undefined))
      return { className: null, style: block.style ?? {} }
    const styles = editor.effectiveDocument.value.styles ?? {}
    const candidates = [
      ...Object.keys(styles)
        .filter(key => isComboKey(key) && classKeyApplies(key, classes))
        .sort((a, b) => parseClassKey(b).length - parseClassKey(a).length),
      ...[...classes].reverse(),
    ]
    for (const name of candidates) {
      const style = styles[name] as Record<string, unknown> | undefined
      if (style && keys.some(key => style[key] !== undefined))
        return { className: name, style: styles[name]! }
    }
    return { className: classes[0]!, style: styles[classes[0]!] ?? {} }
  }

  function writeGestureStyle(blockId: string, keys: string[], patch: (current: BlockStyles) => BlockStyles) {
    const block = findBlock(editor.document.value.blocks, blockId)
    if (!block)
      return
    const target = styleWriteTarget(block, keys)
    const next = patch(target.style)
    if (target.className)
      editor.updateClassStyle(target.className, next)
    else
      editor.updateBlockStyle(blockId, next)
  }

  const selectedBaseTracks = computed<SelectedBaseTracks | null>(() => {
    const id = editor.selectedBlockId.value
    const block = id ? findBlock(editor.document.value.blocks, id) : null
    if (!block)
      return null
    return {
      columns: parseTrackList(styleWriteTarget(block, ['gridTemplateColumns']).style.gridTemplateColumns),
      rows: parseTrackList(styleWriteTarget(block, ['gridTemplateRows']).style.gridTemplateRows),
    }
  })

  const gridHandles = computed<GridHandle[]>(() => {
    const box = gridBox.value
    const base = selectedBaseTracks.value
    if (!box || !base || isDragging.value || editor.isPreviewMode.value)
      return []
    if (editor.editBreakpoint.value !== 'base')
      return []

    const { rect, offsetLeft, offsetTop, columns, rows, columnGap, rowGap } = box
    const contentLeft = rect.left + offsetLeft
    const contentTop = rect.top + offsetTop
    const contentWidth = columns.length ? sum(columns) + (columns.length - 1) * columnGap : rect.width - offsetLeft
    const contentHeight = rows.length ? sum(rows) + (rows.length - 1) * rowGap : rect.height - offsetTop
    const out: GridHandle[] = []
    const HANDLE_MIN = 8
    if (columns.length > 1 && base.columns.length === columns.length) {
      let x = contentLeft
      for (let i = 0; i < columns.length - 1; i++) {
        x += columns[i]
        const w = Math.max(columnGap, HANDLE_MIN)
        out.push({ key: `ch-${i}`, axis: 'col', index: i, style: { left: `${x + columnGap / 2 - w / 2}px`, top: `${contentTop}px`, width: `${w}px`, height: `${contentHeight}px` } })
        x += columnGap
      }
    }
    if (rows.length > 1 && base.rows.length === rows.length) {
      let y = contentTop
      for (let i = 0; i < rows.length - 1; i++) {
        y += rows[i]
        const h = Math.max(rowGap, HANDLE_MIN)
        out.push({ key: `rh-${i}`, axis: 'row', index: i, style: { left: `${contentLeft}px`, top: `${y + rowGap / 2 - h / 2}px`, width: `${contentWidth}px`, height: `${h}px` } })
        y += rowGap
      }
    }
    return out
  })

  const gridGapHandles = computed<GapHandle[]>(() => {
    const box = gridBox.value
    if (!box || isDragging.value || editor.isPreviewMode.value)
      return []
    if (editor.editBreakpoint.value !== 'base')
      return []

    const { rect, offsetLeft, offsetTop, columns, rows, columnGap, rowGap } = box
    const contentLeft = rect.left + offsetLeft
    const contentTop = rect.top + offsetTop
    const contentWidth = columns.length ? sum(columns) + (columns.length - 1) * columnGap : rect.width - offsetLeft
    const contentHeight = rows.length ? sum(rows) + (rows.length - 1) * rowGap : rect.height - offsetTop
    const midX = contentLeft + contentWidth / 2
    const midY = contentTop + contentHeight / 2
    const gapCenters = (tracks: number[], gap: number, start: number) => {
      const centers: number[] = []
      let edge = start
      for (let i = 0; i < tracks.length - 1; i++) {
        edge += tracks[i]
        centers.push(edge + gap / 2)
        edge += gap
      }
      return centers
    }
    const nearest = (centers: number[], to: number) =>
      centers.length ? centers.reduce((a, b) => (Math.abs(b - to) < Math.abs(a - to) ? b : a)) : to
    const colGripY = nearest(gapCenters(rows, rowGap, contentTop), midY)
    const rowGripX = nearest(gapCenters(columns, columnGap, contentLeft), midX)

    const out: GapHandle[] = []
    if (columns.length > 1) {
      let x = contentLeft
      for (let i = 0; i < columns.length - 1; i++) {
        x += columns[i]
        out.push({ id: `cgap-${i}`, axis: 'col', style: { left: `${x + columnGap / 2}px`, top: `${colGripY}px` } })
        x += columnGap
      }
    }
    if (rows.length > 1) {
      let y = contentTop
      for (let i = 0; i < rows.length - 1; i++) {
        y += rows[i]
        out.push({ id: `rgap-${i}`, axis: 'row', style: { left: `${rowGripX}px`, top: `${y + rowGap / 2}px` } })
        y += rowGap
      }
    }
    return out
  })

  const flexGapHandles = computed<GapHandle[]>(() => {
    const box = flexBox.value
    if (!box || isDragging.value || editor.isPreviewMode.value)
      return []
    if (editor.editBreakpoint.value !== 'base')
      return []
    return box.handles.map(handle => ({
      id: handle.id,
      axis: handle.axis,
      style: { left: `${handle.x}px`, top: `${handle.y}px` },
    }))
  })

  return {
    gridGuides,
    selectedBaseTracks,
    gridHandles,
    gridGapHandles,
    flexGapHandles,
    styleWriteTarget,
    writeGestureStyle,
  }
}
