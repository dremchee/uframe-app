import { describe, expect, it } from 'vitest'
import { resizeCanvasWidth } from './canvas-width-resize'

describe('resizeCanvasWidth', () => {
  it('resizes from either canvas edge and rounds to whole pixels', () => {
    expect(resizeCanvasWidth({
      side: 'right',
      startX: 100,
      currentX: 140.6,
      startWidth: 640,
      maxWidth: 1000,
    })).toBe(681)

    expect(resizeCanvasWidth({
      side: 'left',
      startX: 100,
      currentX: 60.4,
      startWidth: 640,
      maxWidth: 1000,
    })).toBe(680)
  })

  it('uses the canvas minimum width and available-width maximum', () => {
    expect(resizeCanvasWidth({
      side: 'right',
      startX: 0,
      currentX: -500,
      startWidth: 640,
      maxWidth: 1000,
    })).toBe(320)

    expect(resizeCanvasWidth({
      side: 'right',
      startX: 0,
      currentX: 500,
      startWidth: 640,
      maxWidth: 720,
    })).toBe(720)
  })

  it('keeps a narrow available area from overflowing the viewport', () => {
    expect(resizeCanvasWidth({
      side: 'right',
      startX: 0,
      currentX: 100,
      startWidth: 240,
      maxWidth: 280,
    })).toBe(280)
  })

  it('resizes both edges symmetrically around the center', () => {
    expect(resizeCanvasWidth({
      side: 'right',
      startX: 100,
      currentX: 140,
      startWidth: 640,
      maxWidth: 1000,
      centered: true,
    })).toBe(720)

    expect(resizeCanvasWidth({
      side: 'left',
      startX: 100,
      currentX: 140,
      startWidth: 640,
      maxWidth: 1000,
      centered: true,
    })).toBe(560)
  })
})
