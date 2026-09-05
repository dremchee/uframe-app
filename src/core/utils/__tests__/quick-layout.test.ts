import { describe, expect, it } from 'vitest'
import {
  applyAlignment,
  applyLayoutMode,
  applyWidthMode,
  resolveAlignment,
  resolveGridColumnCount,
  resolveLayoutMode,
  resolveUniformPadding,
  resolveWidthMode,
  toggleDistribution,
  withGridColumnCount,
  withUniformPadding,
} from '@/core/utils/quick-layout'

describe('layout mode', () => {
  it('reads the mode from display and flex direction', () => {
    expect(resolveLayoutMode({})).toBe('block')
    expect(resolveLayoutMode({ display: 'block' })).toBe('block')
    expect(resolveLayoutMode({ display: 'flex' })).toBe('row')
    expect(resolveLayoutMode({ display: 'inline-flex', flexDirection: 'row-reverse' })).toBe('row')
    expect(resolveLayoutMode({ display: 'flex', flexDirection: 'column' })).toBe('column')
    expect(resolveLayoutMode({ display: 'flex', flexDirection: 'column-reverse' })).toBe('column')
    expect(resolveLayoutMode({ display: 'grid' })).toBe('grid')
  })

  it('writes explicit values so a breakpoint override can carry them', () => {
    expect(applyLayoutMode({ display: 'flex', flexDirection: 'column' }, 'block')).toEqual({ display: 'block', flexDirection: 'column' })
    expect(applyLayoutMode({}, 'column')).toEqual({ display: 'flex', flexDirection: 'column' })
    expect(applyLayoutMode({}, 'row')).toEqual({ display: 'flex', flexDirection: 'row' })
  })

  it('seeds a grid template only when there is none', () => {
    expect(applyLayoutMode({}, 'grid')).toEqual({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' })
    expect(applyLayoutMode({ gridTemplateColumns: '1fr 2fr' }, 'grid')).toEqual({ display: 'grid', gridTemplateColumns: '1fr 2fr' })
  })
})

describe('grid columns', () => {
  it('counts uniform templates and reports custom ones as null', () => {
    expect(resolveGridColumnCount({})).toBe(1)
    expect(resolveGridColumnCount({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' })).toBe(3)
    expect(resolveGridColumnCount({ gridTemplateColumns: '1fr 1fr 1fr 1fr' })).toBe(4)
    expect(resolveGridColumnCount({ gridTemplateColumns: '1fr 2fr' })).toBeNull()
    expect(resolveGridColumnCount({ gridTemplateColumns: 'repeat(2, 1fr 200px)' })).toBeNull()
    expect(resolveGridColumnCount({ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' })).toBeNull()
    expect(resolveGridColumnCount({ gridTemplateColumns: 'subgrid' })).toBeNull()
  })

  it('keeps the uniform track when changing the count and clamps the range', () => {
    expect(withGridColumnCount({ gridTemplateColumns: 'repeat(3, 200px)' }, 5).gridTemplateColumns).toBe('repeat(5, 200px)')
    expect(withGridColumnCount({ gridTemplateColumns: '1fr 1fr' }, 3).gridTemplateColumns).toBe('repeat(3, 1fr)')
    expect(withGridColumnCount({ gridTemplateColumns: '1fr 2fr' }, 3).gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(withGridColumnCount({}, 0).gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))')
    expect(withGridColumnCount({}, 99).gridTemplateColumns).toBe('repeat(24, minmax(0, 1fr))')
  })
})

describe('alignment', () => {
  it.each(['row', 'column'] as const)('preserves spatial alignment for %s-reverse', (mode) => {
    const initial = { flexDirection: `${mode}-reverse` as const }
    const start = applyAlignment(initial, mode, 'start', 'start')
    expect(start.justifyContent).toBe('flex-end')
    expect(resolveAlignment(start, mode)).toEqual({ horizontal: 'start', vertical: 'start', distributed: false })
    const end = applyAlignment(initial, mode, 'end', 'end')
    expect(end.justifyContent).toBe('flex-start')
    expect(resolveAlignment(end, mode)).toEqual({ horizontal: 'end', vertical: 'end', distributed: false })
    const center = applyAlignment(initial, mode, 'center', 'center')
    expect(center.justifyContent).toBe('center')
    expect(resolveAlignment(center, mode)).toEqual({ horizontal: 'center', vertical: 'center', distributed: false })
  })

  it('maps a flex row to justify (x) and align-items (y)', () => {
    const styles = applyAlignment({}, 'row', 'center', 'end')
    expect(styles).toEqual({ justifyContent: 'center', alignItems: 'flex-end' })
    expect(resolveAlignment(styles, 'row')).toEqual({ horizontal: 'center', vertical: 'end', distributed: false })
  })

  it('swaps the axes for a column', () => {
    const styles = applyAlignment({}, 'column', 'end', 'start')
    expect(styles).toEqual({ alignItems: 'flex-end', justifyContent: 'flex-start' })
    expect(resolveAlignment(styles, 'column')).toEqual({ horizontal: 'end', vertical: 'start', distributed: false })
  })

  it('uses justify-items for a grid and ignores block mode', () => {
    const styles = applyAlignment({}, 'grid', 'start', 'center')
    expect(styles).toEqual({ justifyItems: 'start', alignItems: 'center' })
    expect(resolveAlignment(styles, 'grid')).toEqual({ horizontal: 'start', vertical: 'center', distributed: false })
    expect(applyAlignment({ display: 'block' }, 'block', 'start', 'start')).toEqual({ display: 'block' })
    expect(resolveAlignment({ alignItems: 'stretch' }, 'row')).toEqual({ horizontal: null, vertical: null, distributed: false })
  })

  it('toggles space-between on the flex main axis only', () => {
    const on = toggleDistribution({ display: 'flex' }, 'row')
    expect(on.justifyContent).toBe('space-between')
    expect(resolveAlignment(on, 'row').distributed).toBe(true)
    expect(toggleDistribution(on, 'row').justifyContent).toBe('flex-start')
    expect(toggleDistribution({ display: 'grid' }, 'grid')).toEqual({ display: 'grid' })
  })
})

describe('padding and width', () => {
  it('reports uniform padding, treating all-unset as one empty value', () => {
    expect(resolveUniformPadding({})).toEqual({ kind: 'uniform', value: '' })
    expect(resolveUniformPadding(withUniformPadding({}, '24px'))).toEqual({ kind: 'uniform', value: '24px' })
    expect(resolveUniformPadding({ paddingTop: '8px' })).toEqual({ kind: 'mixed' })
    expect(withUniformPadding({ paddingTop: '8px', paddingLeft: '4px' }, '')).toEqual({})
  })

  it('maps width keywords to modes and back', () => {
    expect(resolveWidthMode({})).toBe('auto')
    expect(resolveWidthMode({ width: 'auto' })).toBe('auto')
    expect(resolveWidthMode({ width: '100%' })).toBe('fill')
    expect(resolveWidthMode({ width: 'fit-content' })).toBe('hug')
    expect(resolveWidthMode({ width: '320px' })).toBe('fixed')
    expect(applyWidthMode({}, 'fill')).toEqual({ width: '100%' })
    expect(applyWidthMode({ width: '100%' }, 'hug')).toEqual({ width: 'fit-content' })
    expect(applyWidthMode({ width: '100%' }, 'auto')).toEqual({ width: 'auto' })
    expect(applyWidthMode({}, 'fixed')).toEqual({ width: '320px' })
    expect(applyWidthMode({ width: '480px' }, 'fixed')).toEqual({ width: '480px' })
  })
})
