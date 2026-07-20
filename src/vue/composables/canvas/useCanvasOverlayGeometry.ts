import type { Ref } from 'vue'
import type { FlexBox, GridBox, Rect, SpacingBox } from './canvas-overlay-types'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import type { FlexItemBox } from '@/vue/utils/canvas-flex'
import { computed, ref } from 'vue'
import { parseCssPixels, SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core'
import { findRenderedBlockElement, renderedBoxElement } from '@/vue/utils/canvas-dom'
import { buildFlexGapHandles } from '@/vue/utils/canvas-flex'

export interface UseCanvasOverlayGeometryOptions {
  editor: PageEditorInstance
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
  hoveredBlockId: Ref<string | null>
}

/** Owns iframe DOM measurement and derived overlay geometry. */
export function useCanvasOverlayGeometry(options: UseCanvasOverlayGeometryOptions) {
  const { editor, iframeDoc, iframeWin, hoveredBlockId } = options

  const selectionRect = ref<Rect | null>(null)
  const selectionRadius = ref<string | null>(null)
  const hoverRect = ref<Rect | null>(null)
  const hoveredBlockLabelId = ref<string | null>(null)
  const spacingBox = ref<SpacingBox | null>(null)
  const gridBox = ref<GridBox | null>(null)
  const flexBox = ref<FlexBox | null>(null)
  const editScopeRect = ref<Rect | null>(null)

  function findRenderedBox(id: string | null): { box: Element, win: Window } | null {
    const doc = iframeDoc.value
    const win = iframeWin.value
    if (!id || !doc || !win)
      return null
    const box = findRenderedBlockElement(doc, win, id)
    return box ? { box, win } : null
  }

  function scrollBlockIntoView(id: string | null) {
    const found = findRenderedBox(id)
    const win = iframeWin.value
    if (!found || !win)
      return
    const rect = found.box.getBoundingClientRect()
    const intersects = rect.bottom > 0 && rect.top < win.innerHeight
      && rect.right > 0 && rect.left < win.innerWidth
    found.box.scrollIntoView({
      block: intersects ? 'nearest' : 'center',
      inline: intersects ? 'nearest' : 'center',
    })
  }

  function measureBlockRect(id: string | null): Rect | null {
    const found = findRenderedBox(id)
    if (!found)
      return null
    const rect = found.box.getBoundingClientRect()
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  }

  function measureSpacingBox(id: string | null): SpacingBox | null {
    const found = findRenderedBox(id)
    if (!found)
      return null
    const rect = found.box.getBoundingClientRect()
    const style = found.win.getComputedStyle(found.box)
    return {
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      margin: { top: parseCssPixels(style.marginTop), right: parseCssPixels(style.marginRight), bottom: parseCssPixels(style.marginBottom), left: parseCssPixels(style.marginLeft) },
      padding: { top: parseCssPixels(style.paddingTop), right: parseCssPixels(style.paddingRight), bottom: parseCssPixels(style.paddingBottom), left: parseCssPixels(style.paddingLeft) },
    }
  }

  function measureGridBox(id: string | null): GridBox | null {
    const found = findRenderedBox(id)
    if (!found)
      return null
    const style = found.win.getComputedStyle(found.box)
    if (!style.display.includes('grid'))
      return null
    const rect = found.box.getBoundingClientRect()
    const tracks = (value: string) => value && value !== 'none'
      ? value.trim().split(/\s+/).map(track => parseCssPixels(track))
      : []
    const rootFontSize = parseCssPixels(found.win.getComputedStyle(found.win.document.documentElement).fontSize, 16)
    return {
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      offsetLeft: parseCssPixels(style.borderLeftWidth) + parseCssPixels(style.paddingLeft),
      offsetTop: parseCssPixels(style.borderTopWidth) + parseCssPixels(style.paddingTop),
      columns: tracks(style.gridTemplateColumns),
      rows: tracks(style.gridTemplateRows),
      columnGap: parseCssPixels(style.columnGap),
      rowGap: parseCssPixels(style.rowGap),
      fontSize: parseCssPixels(style.fontSize, 16),
      rootFontSize,
    }
  }

  function selectedDomId(): string | null {
    return editor.selectedInstanceId.value ?? editor.selectedBlockId.value
  }

  const selectionIsSymbolInstance = computed(
    () => editor.selectedBlock.value?.type === SYMBOL_INSTANCE_BLOCK_TYPE,
  )

  function recomputeSelection() {
    const id = selectedDomId()
    selectionRect.value = measureBlockRect(id)
    const found = findRenderedBox(id)
    if (found) {
      const style = found.win.getComputedStyle(found.box)
      selectionRadius.value = `${style.borderTopLeftRadius} ${style.borderTopRightRadius} ${style.borderBottomRightRadius} ${style.borderBottomLeftRadius}`
    }
    else {
      selectionRadius.value = null
    }
  }

  function recomputeEditScope() {
    editScopeRect.value = measureBlockRect(editor.editScopeRootId.value)
  }

  function recomputeGrid() {
    gridBox.value = selectionIsSymbolInstance.value ? null : measureGridBox(selectedDomId())
  }

  function measureFlexBox(id: string | null): FlexBox | null {
    const found = findRenderedBox(id)
    if (!found || !id)
      return null
    const style = found.win.getComputedStyle(found.box)
    if (!style.display.includes('flex'))
      return null
    const row = style.flexDirection.startsWith('row')
    const rect = found.box.getBoundingClientRect()
    const contentLeft = rect.left + parseCssPixels(style.borderLeftWidth) + parseCssPixels(style.paddingLeft)
    const contentRight = rect.right - parseCssPixels(style.borderRightWidth) - parseCssPixels(style.paddingRight)
    const contentTop = rect.top + parseCssPixels(style.borderTopWidth) + parseCssPixels(style.paddingTop)
    const contentBottom = rect.bottom - parseCssPixels(style.borderBottomWidth) - parseCssPixels(style.paddingBottom)
    const base: FlexBox = {
      columnGap: parseCssPixels(style.columnGap),
      rowGap: parseCssPixels(style.rowGap),
      contentWidth: contentRight - contentLeft,
      contentHeight: contentBottom - contentTop,
      fontSize: parseCssPixels(style.fontSize, 16),
      rootFontSize: parseCssPixels(found.win.getComputedStyle(found.win.document.documentElement).fontSize, 16),
      handles: [],
    }
    if (editor.isPreviewMode.value || editor.editBreakpoint.value !== 'base')
      return base

    const items = Array.from(found.box.children)
      .map((element, index): FlexItemBox | null => {
        const current = renderedBoxElement(element, found.win)
        if (!current)
          return null
        const itemStyle = found.win.getComputedStyle(current)
        return {
          id: element.getAttribute('data-block-id') || `i${index}`,
          rect: current.getBoundingClientRect(),
          margin: {
            top: parseCssPixels(itemStyle.marginTop),
            right: parseCssPixels(itemStyle.marginRight),
            bottom: parseCssPixels(itemStyle.marginBottom),
            left: parseCssPixels(itemStyle.marginLeft),
          },
        }
      })
      .filter((item): item is FlexItemBox => !!item)
    base.handles = buildFlexGapHandles({
      row,
      content: { left: contentLeft, right: contentRight, top: contentTop, bottom: contentBottom },
      items,
    })
    return base
  }

  function recomputeFlex() {
    flexBox.value = selectionIsSymbolInstance.value || editor.selectedInstanceId.value
      ? null
      : measureFlexBox(editor.selectedBlockId.value)
  }

  function recomputeHover() {
    const id = hoveredBlockId.value
    if (!id || id === editor.selectedBlockId.value) {
      hoverRect.value = null
      hoveredBlockLabelId.value = null
      return
    }
    hoverRect.value = measureBlockRect(editor.hoveredInstanceId.value ?? id)
    hoveredBlockLabelId.value = id
  }

  function recomputeSpacing() {
    spacingBox.value = editor.spacingOverlay.value
      ? measureSpacingBox(selectedDomId())
      : null
  }

  function recomputeAll() {
    recomputeSelection()
    recomputeHover()
    recomputeSpacing()
    recomputeGrid()
    recomputeFlex()
    recomputeEditScope()
  }

  return {
    selectionRect,
    selectionRadius,
    hoverRect,
    hoveredBlockLabelId,
    spacingBox,
    gridBox,
    flexBox,
    editScopeRect,
    selectedDomId,
    measureBlockRect,
    measureSpacingBox,
    recomputeSelection,
    recomputeHover,
    recomputeSpacing,
    recomputeGrid,
    recomputeFlex,
    recomputeEditScope,
    recomputeAll,
    scrollBlockIntoView,
  }
}
