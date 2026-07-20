import { describe, expect, it } from 'vitest'
import { formatGridGapSize, formatGridTrackSize, gridTrackUnit, makeEqualTracks, parseGridTemplate, parseTrackList, resizeAdjacentTracks, serializeGridTemplate, serializeTrackList } from '@/core/utils/grid-template'

describe('parseTrackList', () => {
  it('splits simple track lists on whitespace', () => {
    expect(parseTrackList('1fr 1fr 200px').map(t => t.size)).toEqual(['1fr', '1fr', '200px'])
  })

  it('keeps parenthesised functions intact', () => {
    expect(parseTrackList('minmax(100px, 1fr) auto repeat(2, 1fr)').map(t => t.size))
      .toEqual(['minmax(100px, 1fr)', 'auto', 'repeat(2, 1fr)'])
  })

  it('collapses extra whitespace', () => {
    expect(parseTrackList('  1fr   2fr  ').map(t => t.size)).toEqual(['1fr', '2fr'])
  })

  it('treats empty / none / nullish as no tracks', () => {
    expect(parseTrackList('')).toEqual([])
    expect(parseTrackList('   ')).toEqual([])
    expect(parseTrackList('none')).toEqual([])
    expect(parseTrackList(undefined)).toEqual([])
    expect(parseTrackList(null)).toEqual([])
  })
})

describe('serializeTrackList', () => {
  it('joins tracks with single spaces', () => {
    expect(serializeTrackList([{ size: '1fr' }, { size: '200px' }])).toBe('1fr 200px')
  })

  it('drops blank tracks and trims', () => {
    expect(serializeTrackList([{ size: ' 1fr ' }, { size: '' }, { size: 'auto' }])).toBe('1fr auto')
  })

  it('round-trips with parseTrackList', () => {
    const css = 'minmax(100px, 1fr) auto 2fr'
    expect(serializeTrackList(parseTrackList(css))).toBe(css)
  })
})

describe('makeEqualTracks', () => {
  it('builds N equal tracks, defaulting to 1fr', () => {
    expect(serializeTrackList(makeEqualTracks(3))).toBe('1fr 1fr 1fr')
    expect(serializeTrackList(makeEqualTracks(2, '100px'))).toBe('100px 100px')
  })

  it('clamps negative counts to empty', () => {
    expect(makeEqualTracks(-1)).toEqual([])
  })
})

describe('grid unit conversion', () => {
  const context = { frRatio: 80, pctBase: 400, fontSize: 20, rootFontSize: 16 }

  it('recognizes the resizable grid units', () => {
    expect(gridTrackUnit('120px')).toBe('px')
    expect(gridTrackUnit('1.5fr')).toBe('fr')
    expect(gridTrackUnit('25%')).toBe('pct')
    expect(gridTrackUnit('2rem')).toBe('rem')
    expect(gridTrackUnit('1em')).toBe('em')
    expect(gridTrackUnit('minmax(100px, 1fr)')).toBeNull()
  })

  it('converts track pixels while preserving authored units and bounds', () => {
    expect(formatGridTrackSize(160, 'fr', context)).toBe('2fr')
    expect(formatGridTrackSize(100, 'pct', context)).toBe('25%')
    expect(formatGridTrackSize(32, 'rem', context)).toBe('2rem')
    expect(formatGridTrackSize(30, 'em', context)).toBe('1.5em')
    expect(formatGridTrackSize(5, null, context)).toBe('8px')
  })

  it('converts gaps without allowing negative values', () => {
    expect(formatGridGapSize(32, 'rem', context)).toBe('2rem')
    expect(formatGridGapSize(100, 'pct', context)).toBe('25%')
    expect(formatGridGapSize(-20, null, context)).toBe('0px')
    expect(formatGridGapSize(900, null, context)).toBe('400px')
  })
})

describe('resizeAdjacentTracks', () => {
  it('grows one track and shrinks the neighbour by the same delta', () => {
    // boundary 0, drag +30px: track 0 → 130, track 1 → 70 (sum preserved)
    expect(resizeAdjacentTracks([100, 100, 100], 0, 30, 12)).toEqual({ aPx: 130, bPx: 70 })
  })

  it('handles a negative delta (drag the other way)', () => {
    expect(resizeAdjacentTracks([100, 100], 0, -40, 12)).toEqual({ aPx: 60, bPx: 140 })
  })

  it('clamps so the shrinking neighbour never drops below minPx', () => {
    // +95 would leave track 1 at 5px; clamp to 88 so it stays at minPx (12).
    expect(resizeAdjacentTracks([100, 100], 0, 95, 12)).toEqual({ aPx: 188, bPx: 12 })
  })

  it('clamps so the dragged track never drops below minPx', () => {
    expect(resizeAdjacentTracks([100, 100], 0, -95, 12)).toEqual({ aPx: 12, bPx: 188 })
  })

  it('always conserves the combined width of the pair', () => {
    const { aPx, bPx } = resizeAdjacentTracks([80, 200, 60], 1, 500, 12)
    expect(aPx + bPx).toBe(260)
  })

  it('never returns a negative size when both tracks start below minPx', () => {
    // bounds would cross with a fixed minPx; the relaxed floor keeps both >= 0
    const { aPx, bPx } = resizeAdjacentTracks([5, 5], 0, 0, 12)
    expect(aPx).toBeGreaterThanOrEqual(0)
    expect(bPx).toBeGreaterThanOrEqual(0)
    expect(aPx + bPx).toBe(10)
    // a huge drag still can't drive either side negative
    const r = resizeAdjacentTracks([5, 5], 0, 999, 12)
    expect(r.aPx).toBeGreaterThanOrEqual(0)
    expect(r.bPx).toBeGreaterThanOrEqual(0)
  })
})

describe('parseGridTemplate / serializeGridTemplate', () => {
  it('parses the auto-fit responsive pattern', () => {
    expect(parseGridTemplate('repeat(auto-fit, minmax(240px, 1fr))')).toEqual({
      mode: 'auto',
      repeat: 'auto-fit',
      min: '240px',
      max: '1fr',
    })
  })

  it('parses auto-fill and tolerates whitespace', () => {
    expect(parseGridTemplate('repeat( auto-fill ,  minmax( 12rem , 320px ) )')).toEqual({
      mode: 'auto',
      repeat: 'auto-fill',
      min: '12rem',
      max: '320px',
    })
  })

  it('parses fixed repeats while preserving compound track patterns', () => {
    expect(parseGridTemplate('repeat(2, minmax(0, 1fr))')).toEqual({
      mode: 'repeat',
      count: 2,
      pattern: 'minmax(0, 1fr)',
    })
    expect(parseGridTemplate('repeat( 3 , 1fr 2fr )')).toEqual({
      mode: 'repeat',
      count: 3,
      pattern: '1fr 2fr',
    })
  })

  it('falls back to explicit tracks for non-repeat values', () => {
    expect(parseGridTemplate('1fr 1fr 200px')).toEqual({
      mode: 'tracks',
      tracks: [{ size: '1fr' }, { size: '1fr' }, { size: '200px' }],
    })
    expect(parseGridTemplate('repeat(0, 1fr)')).toEqual({
      mode: 'tracks',
      tracks: [{ size: 'repeat(0, 1fr)' }],
    })
  })

  it('round-trips auto and tracks', () => {
    const auto = parseGridTemplate('repeat(auto-fit, minmax(240px, 1fr))')
    expect(serializeGridTemplate(auto)).toBe('repeat(auto-fit, minmax(240px, 1fr))')
    expect(serializeGridTemplate({ mode: 'repeat', count: 2, pattern: 'minmax(0, 1fr)' }))
      .toBe('repeat(2, minmax(0, 1fr))')
    expect(serializeGridTemplate({ mode: 'tracks', tracks: [{ size: '1fr' }, { size: 'auto' }] })).toBe('1fr auto')
  })

  it('fills in defaults for blank auto min/max', () => {
    expect(serializeGridTemplate({ mode: 'auto', repeat: 'auto-fit', min: '', max: '' }))
      .toBe('repeat(auto-fit, minmax(240px, 1fr))')
  })
})
