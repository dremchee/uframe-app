import type { CanvasGridOptions } from './useCanvasGridGeometry'
import { useCanvasGridDrag } from './useCanvasGridDrag'
import { useCanvasGridGeometry } from './useCanvasGridGeometry'

/**
 * Grid/flex canvas overlay facade. Geometry and pointer mutations live in
 * separate composables; this stable facade keeps CanvasViewport unchanged.
 */
export function useCanvasGrid(opts: CanvasGridOptions) {
  const geometry = useCanvasGridGeometry(opts)
  const drag = useCanvasGridDrag({
    ...opts,
    selectedBaseTracks: geometry.selectedBaseTracks,
    gridGapHandles: geometry.gridGapHandles,
    flexGapHandles: geometry.flexGapHandles,
    styleWriteTarget: geometry.styleWriteTarget,
    writeGestureStyle: geometry.writeGestureStyle,
  })

  return {
    gridGuides: geometry.gridGuides,
    gridHandles: geometry.gridHandles,
    onGridHandleDown: drag.onGridHandleDown,
    onGridHandleMove: drag.onGridHandleMove,
    onGridHandleUp: drag.onGridHandleUp,
    gapHandles: drag.gapHandles,
    flexGapSensors: drag.flexGapSensors,
    gapBands: drag.gapBands,
    gapDrag: drag.gapDrag,
    gapHover: drag.gapHover,
    onGapHandleDown: drag.onGapHandleDown,
    onGapHandleMove: drag.onGapHandleMove,
    onGapHandleUp: drag.onGapHandleUp,
    onGapHandleEnter: drag.onGapHandleEnter,
    onGapHandleLeave: drag.onGapHandleLeave,
  }
}
