import type { GridBox } from '@/vue/composables/canvas/useCanvasOverlays'
import { describe, expect, it } from 'vitest'
import { buildGridGuides } from './canvas-grid'

const box: GridBox = {
  rect: { top: 10, left: 20, width: 400, height: 300 },
  offsetLeft: 5,
  offsetTop: 6,
  columns: [100, 200],
  rows: [80, 120],
  columnGap: 12,
  rowGap: 8,
  fontSize: 16,
  rootFontSize: 16,
}

describe('buildGridGuides', () => {
  it('creates content outline and both edges of every non-zero grid gap', () => {
    expect(buildGridGuides(box)).toEqual({
      outline: { left: '25px', top: '16px', width: '312px', height: '208px' },
      lines: [
        { key: 'cl-0a', vertical: true, style: { left: '125px', top: '16px', height: '208px' } },
        { key: 'cl-0b', vertical: true, style: { left: '137px', top: '16px', height: '208px' } },
        { key: 'rl-0a', vertical: false, style: { left: '25px', top: '96px', width: '312px' } },
        { key: 'rl-0b', vertical: false, style: { left: '25px', top: '104px', width: '312px' } },
      ],
    })
  })

  it('does not create a guide for an implicit-only grid', () => {
    expect(buildGridGuides({ ...box, columns: [], rows: [] })).toBeNull()
  })
})
