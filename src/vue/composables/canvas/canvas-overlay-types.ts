import type { FlexHandle as CanvasFlexHandle } from '@/vue/utils/canvas-flex'

export interface Rect { top: number, left: number, width: number, height: number }
export interface Edges { top: number, right: number, bottom: number, left: number }
export interface SpacingBox { rect: Rect, margin: Edges, padding: Edges }

/** Resolved grid geometry measured from the canvas iframe. */
export interface GridBox {
  rect: Rect
  offsetLeft: number
  offsetTop: number
  columns: number[]
  rows: number[]
  columnGap: number
  rowGap: number
  fontSize: number
  rootFontSize: number
}

export type FlexHandle = CanvasFlexHandle

/** Resolved flex geometry used by the canvas gap grips. */
export interface FlexBox {
  columnGap: number
  rowGap: number
  contentWidth: number
  contentHeight: number
  fontSize: number
  rootFontSize: number
  handles: FlexHandle[]
}
