import { describe, expect, it } from 'vitest'
import { placeCanvasPanel } from '@/vue/utils/canvas-panel-placement'

const pane = { left: 100, top: 50, width: 900, height: 800 }
const size = { width: 320, height: 400 }
describe('canvas panel placement', () => {
  it('uses the right side when available', () => {
    expect(placeCanvasPanel(pane, { left: 150, top: 100, width: 200, height: 100 }, size)).toEqual({ left: 362, top: 100, docked: false })
  })
  it('uses the left side when the right is blocked', () => {
    expect(placeCanvasPanel(pane, { left: 700, top: 100, width: 250, height: 100 }, size)).toEqual({ left: 368, top: 100, docked: false })
  })
  it('puts a panel below a full-width block', () => {
    expect(placeCanvasPanel(pane, { left: 100, top: 70, width: 900, height: 100 }, size)).toEqual({ left: 112, top: 202, docked: false })
  })
  it('uses space above a block near the bottom after scrolling', () => {
    expect(placeCanvasPanel(pane, { left: 100, top: 700, width: 900, height: 100 }, size)).toEqual({ left: 112, top: 288, docked: false })
  })
  it('docks when the selection fills the pane', () => {
    expect(placeCanvasPanel(pane, pane, size).docked).toBe(true)
  })
  it('keeps a narrow pane within its horizontal bounds', () => {
    const narrow = { left: 100, top: 50, width: 240, height: 800 }
    expect(placeCanvasPanel(narrow, { ...narrow, height: 100 }, size)).toEqual({ left: 112, top: 182, docked: false })
  })
})
