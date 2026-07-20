import type { Ref } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { useCanvasOverlayGeometry } from './useCanvasOverlayGeometry'
import { useCanvasOverlayObservers } from './useCanvasOverlayObservers'

export type { Edges, FlexBox, FlexHandle, GridBox, Rect, SpacingBox } from './canvas-overlay-types'

/**
 * Public canvas overlay facade. DOM measurement lives in
 * `useCanvasOverlayGeometry`, while reactive observers live in
 * `useCanvasOverlayObservers`; CanvasViewport keeps its existing contract.
 */
export function useCanvasOverlays(opts: {
  editor: PageEditorInstance
  frameRef: Ref<HTMLIFrameElement | null>
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
  hoveredBlockId: Ref<string | null>
  isDragging: Ref<boolean>
}) {
  const { editor, frameRef, iframeDoc, iframeWin, hoveredBlockId, isDragging } = opts
  const geometry = useCanvasOverlayGeometry({ editor, iframeDoc, iframeWin, hoveredBlockId })
  const {
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
  } = geometry

  useCanvasOverlayObservers({
    editor,
    frameRef,
    iframeDoc,
    iframeWin,
    hoveredBlockId,
    isDragging,
    selectedDomId,
    measureBlockRect,
    measureSpacingBox,
    recomputeAll,
    recomputeSelection,
    recomputeHover,
    recomputeSpacing,
    recomputeGrid,
    recomputeFlex,
    recomputeEditScope,
    hoverRect,
    hoveredBlockLabelId,
  })

  const hoveredLabelId = computed(() => hoveredBlockLabelId.value)

  return {
    selectionRect,
    selectionRadius,
    hoverRect,
    spacingBox,
    gridBox,
    flexBox,
    editScopeRect,
    hoveredLabelId,
    recomputeAll,
    scrollBlockIntoView,
  }
}
