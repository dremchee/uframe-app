export type CanvasResizeSide = 'left' | 'right'

export const MIN_CANVAS_RESIZE_WIDTH = 320
export const CANVAS_RESIZE_HANDLE_OUTSET = 12

interface ResizeCanvasWidthOptions {
  side: CanvasResizeSide
  startX: number
  currentX: number
  startWidth: number
  maxWidth: number
  minWidth?: number
  /** Resize both edges around the current center while one handle is dragged. */
  centered?: boolean
}

/**
 * Shared width rule for the canvas and container-query preview handles.
 * Keep the upper clamp last so a canvas narrower than the normal minimum
 * remains usable instead of overflowing its available area.
 */
export function resizeCanvasWidth(options: ResizeCanvasWidthOptions): number {
  const {
    side,
    startX,
    currentX,
    startWidth,
    maxWidth,
    minWidth = MIN_CANVAS_RESIZE_WIDTH,
    centered = false,
  } = options
  const delta = (currentX - startX) * (centered ? 2 : 1)
  const nextWidth = startWidth + (side === 'right' ? delta : -delta)
  return Math.round(Math.min(maxWidth, Math.max(minWidth, nextWidth)))
}
