import type { Ref } from 'vue'
import type { FlexBox, GridBox, Rect, SpacingBox } from './canvas-overlay-types'
import type { CanvasDropIndicator } from './useCanvasDropOverlay'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE, findBlock, parseCssPixels, SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core'
import { findRenderedBlockElement } from '@/vue/utils/canvas-dom'

interface SpacingBand {
  key: string
  group: 'margin' | 'padding'
  side: string
  value: number
  active: boolean
  style: Record<string, string>
}

export interface UseCanvasOverlayPresentationOptions {
  editor: PageEditorInstance
  frameRef: Ref<HTMLIFrameElement | null>
  iframeWin: Ref<Window | null>
  indicator: Ref<CanvasDropIndicator | null>
  selectionRect: Ref<Rect | null>
  hoverRect: Ref<Rect | null>
  spacingBox: Ref<SpacingBox | null>
  gridBox: Ref<GridBox | null>
  flexBox: Ref<FlexBox | null>
  editScopeRect: Ref<Rect | null>
  hoveredLabelId: Ref<string | null>
}

/**
 * Derives styles and visual state for the canvas overlay. Geometry stays in
 * `useCanvasOverlays`, while mutations remain in the editor/grid/DnD actions.
 */
export function useCanvasOverlayPresentation(options: UseCanvasOverlayPresentationOptions) {
  const {
    editor,
    frameRef,
    iframeWin,
    indicator,
    selectionRect,
    hoverRect,
    spacingBox,
    gridBox,
    flexBox,
    editScopeRect,
    hoveredLabelId,
  } = options

  const spacingBands = computed<SpacingBand[]>(() => {
    const box = spacingBox.value
    if (!box)
      return []
    const { rect, margin, padding } = box
    const active = editor.spacingOverlay.value
    const marginBox = {
      top: rect.top - margin.top,
      left: rect.left - margin.left,
      width: rect.width + margin.left + margin.right,
      height: rect.height + margin.top + margin.bottom,
    }
    const inner = { top: rect.top + padding.top, height: rect.height - padding.top - padding.bottom }
    const bands: SpacingBand[] = []
    function push(group: SpacingBand['group'], side: string, top: number, left: number, width: number, height: number, value: number) {
      if (width <= 0.5 || height <= 0.5)
        return
      bands.push({
        key: `${group}-${side}`,
        group,
        side,
        value,
        active: active?.group === group && active?.side === side,
        style: { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` },
      })
    }
    push('margin', 'Top', marginBox.top, marginBox.left, marginBox.width, margin.top, margin.top)
    push('margin', 'Bottom', rect.top + rect.height, marginBox.left, marginBox.width, margin.bottom, margin.bottom)
    push('margin', 'Left', rect.top, marginBox.left, margin.left, rect.height, margin.left)
    push('margin', 'Right', rect.top, rect.left + rect.width, margin.right, rect.height, margin.right)
    push('padding', 'Top', rect.top, rect.left, rect.width, padding.top, padding.top)
    push('padding', 'Bottom', rect.top + rect.height - padding.bottom, rect.left, rect.width, padding.bottom, padding.bottom)
    push('padding', 'Left', inner.top, rect.left, padding.left, inner.height, padding.left)
    push('padding', 'Right', inner.top, rect.left + rect.width - padding.right, padding.right, inner.height, padding.right)
    return bands
  })

  function bandColor(band: Pick<SpacingBand, 'group' | 'active'>) {
    const activeGroup = editor.spacingOverlay.value?.group === band.group
    const alpha = band.active ? 0.6 : activeGroup ? 0.42 : 0.28
    return band.group === 'margin' ? `rgba(246, 178, 107, ${alpha})` : `rgba(140, 200, 130, ${alpha})`
  }

  const canvasWidthStyle = computed(() =>
    editor.canvasWidth.value != null ? `min(100%, ${editor.canvasWidth.value}px)` : '100%',
  )

  const indicatorClass = computed(() => {
    if (!indicator.value)
      return ''
    if (indicator.value.position !== 'inside')
      return 'bg-uf-accent rounded-sm shadow-[0_0_0_1px_rgb(255_255_255/60%)]'
    return indicator.value.slotId
      ? 'bg-uf-symbol/10 outline-2 outline-uf-symbol -outline-offset-1 rounded'
      : 'bg-uf-accent/10 outline-2 outline-uf-accent -outline-offset-1 rounded'
  })

  const indicatorStyle = computed<Record<string, string> | null>(() => {
    if (!indicator.value)
      return null
    const { rect, position } = indicator.value
    if (position === 'inside')
      return { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` }
    const yOffset = position === 'before' ? rect.top - 1 : rect.top + rect.height - 1
    return { top: `${yOffset}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: '2px' }
  })

  function rectStyle(rect: Rect | null, outline: string) {
    if (!rect)
      return undefined
    return {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      outline,
      outlineOffset: '-1px',
      borderRadius: '2px',
    }
  }

  const isSelectedSymbol = computed(() => {
    const id = editor.selectedBlockId.value
    return id ? findBlock(editor.document.value.blocks, id)?.type === SYMBOL_INSTANCE_BLOCK_TYPE : false
  })
  const isSelectedData = computed(() => {
    const id = editor.selectedBlockId.value
    const block = id ? findBlock(editor.document.value.blocks, id) : undefined
    return !!block && (block.type === DATA_LIST_BLOCK_TYPE
      || block.type === DATA_ITEM_BLOCK_TYPE
      || !!(block.bindings && Object.keys(block.bindings).length))
  })
  const isGapContainer = computed(() => !!gridBox.value || !!flexBox.value)
  const selectionColorVar = computed(() =>
    isSelectedSymbol.value
      ? 'var(--color-uf-symbol)'
      : isSelectedData.value
        ? 'var(--color-uf-data)'
        : isGapContainer.value
          ? 'var(--color-uf-gap)'
          : 'var(--color-uf-accent)',
  )
  const selectionStyle = computed(() => rectStyle(selectionRect.value, `2px solid ${selectionColorVar.value}`))
  const hoverStyle = computed(() => rectStyle(hoverRect.value, '1px solid rgb(148 163 184 / 0.9)'))

  const BADGE_H = 20
  const BADGE_FIT = BADGE_H - 4
  const BADGE_MIN_LEFT = 88

  function topRoomFor(id: string | null): number {
    const win = iframeWin.value
    if (!id || !win)
      return 0
    const el = findRenderedBlockElement(win.document, win, id)
    if (!el)
      return 0
    const style = win.getComputedStyle(el)
    return parseCssPixels(style.borderTopWidth) + parseCssPixels(style.paddingTop)
  }

  function labelStyleFor(rect: Rect | null, topRoom: number): Record<string, string> | null {
    if (!rect)
      return null
    if (rect.top >= BADGE_H + 4)
      return { top: `${rect.top - BADGE_H - 3}px`, left: `${rect.left}px` }
    if (topRoom >= BADGE_FIT)
      return { top: `${rect.top + 3}px`, left: `${rect.left + 3}px` }
    if (rect.left >= BADGE_MIN_LEFT)
      return { top: `${rect.top + 1}px`, left: `${rect.left - 6}px`, transform: 'translateX(-100%)' }
    return { top: `${rect.top + rect.height + 3}px`, left: `${rect.left}px` }
  }

  const selectionLabelStyle = computed(() => labelStyleFor(selectionRect.value, topRoomFor(editor.selectedBlockId.value)))
  const hoverLabelStyle = computed(() => labelStyleFor(hoverRect.value, topRoomFor(hoveredLabelId.value)))

  const editScrimStyle = computed(() => {
    const rect = editScopeRect.value
    return rect
      ? { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px` }
      : null
  })
  const bannerAtBottom = computed(() => {
    const rect = editScopeRect.value
    const height = frameRef.value?.clientHeight ?? 0
    return !rect || !height || rect.top + rect.height / 2 < height / 2
  })
  const editingSymbol = computed(() => {
    const id = editor.editingSymbolId.value
    return id ? editor.effectiveDocument.value.symbols?.[id] ?? null : null
  })

  return {
    bannerAtBottom,
    bandColor,
    canvasWidthStyle,
    editingSymbol,
    editScrimStyle,
    hoverLabelStyle,
    hoverStyle,
    indicatorClass,
    indicatorStyle,
    isGapContainer,
    isSelectedData,
    isSelectedSymbol,
    selectionLabelStyle,
    selectionStyle,
    spacingBands,
  }
}
