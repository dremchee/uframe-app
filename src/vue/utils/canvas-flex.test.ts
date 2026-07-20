import { describe, expect, it } from 'vitest'
import { buildFlexGapHandles } from './canvas-flex'

describe('buildFlexGapHandles', () => {
  it('creates inline and wrapped-line grips from margin-box gaps', () => {
    const handles = buildFlexGapHandles({
      row: true,
      content: { left: 0, top: 0, right: 300, bottom: 200 },
      items: [
        { id: 'a', rect: { left: 10, top: 20, right: 60, bottom: 50 }, margin: { top: 2, right: 3, bottom: 4, left: 1 } },
        { id: 'b', rect: { left: 80, top: 20, right: 130, bottom: 50 }, margin: { top: 2, right: 1, bottom: 4, left: 5 } },
        { id: 'c', rect: { left: 10, top: 80, right: 60, bottom: 110 }, margin: { top: 3, right: 0, bottom: 2, left: 0 } },
      ],
    })

    expect(handles).toEqual([
      { axis: 'col', id: 'a|b', x: 69, y: 35, band: { left: 63, top: 20, width: 12, height: 30 } },
      { axis: 'row', id: 'b|c', x: 150, y: 65.5, band: { left: 0, top: 54, width: 300, height: 23 } },
    ])
  })

  it('keeps a zero-width grip so a collapsed gap can be expanded', () => {
    expect(buildFlexGapHandles({
      row: true,
      content: { left: 0, top: 0, right: 100, bottom: 100 },
      items: [
        { id: 'a', rect: { left: 0, top: 0, right: 50, bottom: 20 }, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
        { id: 'b', rect: { left: 50, top: 0, right: 100, bottom: 20 }, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
      ],
    })[0]).toMatchObject({ axis: 'col', band: { left: 50, width: 0 } })
  })
})
