import { describe, expect, it } from 'vitest'
import {
  detectBackgroundType,
  parseImageUrl,
  serializeImageUrl,
} from '@/core/utils/css-background'
import { parseGradient, serializeGradient } from '@/core/utils/css-gradients'

describe('detectBackgroundType', () => {
  it('classifies by the stored values', () => {
    expect(detectBackgroundType({})).toBe('none')
    expect(detectBackgroundType({ backgroundColor: '#fff' })).toBe('color')
    expect(detectBackgroundType({ backgroundImage: 'url("a.png")' })).toBe('image')
    expect(detectBackgroundType({ backgroundImage: 'https://x/a.png' })).toBe('none')
    expect(detectBackgroundType({ backgroundImage: 'linear-gradient(90deg, #000, #fff)' })).toBe('linear')
    expect(detectBackgroundType({ backgroundImage: 'radial-gradient(circle at center, #000, #fff)' })).toBe('radial')
  })

  it('prefers an image/gradient over a colour', () => {
    expect(detectBackgroundType({ backgroundColor: '#fff', backgroundImage: 'linear-gradient(#000, #fff)' })).toBe('linear')
  })
})

describe('parseImageUrl / serializeImageUrl', () => {
  it('unwraps CSS url() values only', () => {
    expect(parseImageUrl('url("a.png")')).toBe('a.png')
    expect(parseImageUrl('url(a.png)')).toBe('a.png')
    expect(parseImageUrl('https://x/a.png')).toBe('')
    expect(parseImageUrl('')).toBe('')
    expect(parseImageUrl('linear-gradient(#000, #fff)')).toBe('')
  })

  it('wraps a URL, empty for blank', () => {
    expect(serializeImageUrl('a.png')).toBe('url("a.png")')
    expect(serializeImageUrl('  ')).toBe('')
  })
})

describe('parseGradient', () => {
  it('returns null for non-gradients', () => {
    expect(parseGradient('')).toBeNull()
    expect(parseGradient(undefined)).toBeNull()
    expect(parseGradient('url("a.png")')).toBeNull()
    expect(parseGradient('#fff')).toBeNull()
  })

  it('parses a linear gradient with angle and percentage stops', () => {
    const g = parseGradient('linear-gradient(45deg, #ff0000 0%, #0000ff 100%)')
    expect(g).toEqual({
      type: 'linear',
      angle: 45,
      stops: [
        { id: 'gs-0', color: '#ff0000', position: 0 },
        { id: 'gs-1', color: '#0000ff', position: 100 },
      ],
    })
  })

  it('parses `to <side>` directions into degrees', () => {
    expect(parseGradient('linear-gradient(to right, #000, #fff)')).toMatchObject({ angle: 90 })
    expect(parseGradient('linear-gradient(to top left, #000, #fff)')).toMatchObject({ angle: 315 })
  })

  it('defaults the angle and distributes missing stop positions', () => {
    const g = parseGradient('linear-gradient(#000, #888, #fff)')
    expect(g).toMatchObject({
      angle: 180,
      stops: [
        { color: '#000', position: 0 },
        { color: '#888', position: 50 },
        { color: '#fff', position: 100 },
      ],
    })
  })

  it('keeps commas inside rgb()/rgba() colours intact', () => {
    const g = parseGradient('linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, rgb(255, 255, 255) 100%)')
    expect(g?.stops).toEqual([
      { id: 'gs-0', color: 'rgba(0, 0, 0, 0.5)', position: 0 },
      { id: 'gs-1', color: 'rgb(255, 255, 255)', position: 100 },
    ])
  })

  it('keeps var() stop colours intact (incl. a comma-bearing fallback)', () => {
    const g = parseGradient('linear-gradient(90deg, var(--brand) 0%, var(--c, #fff) 100%)')
    expect(g?.stops).toEqual([
      { id: 'gs-0', color: 'var(--brand)', position: 0 },
      { id: 'gs-1', color: 'var(--c, #fff)', position: 100 },
    ])
    expect(serializeGradient(g!)).toBe('linear-gradient(90deg, var(--brand) 0%, var(--c, #fff) 100%)')
  })

  it('parses a radial gradient shape and position', () => {
    const g = parseGradient('radial-gradient(circle at top left, #000 0%, #fff 100%)')
    expect(g).toEqual({
      type: 'radial',
      shape: 'circle',
      position: 'top left',
      stops: [
        { id: 'gs-0', color: '#000', position: 0 },
        { id: 'gs-1', color: '#fff', position: 100 },
      ],
    })
  })

  it('defaults radial shape/position when omitted', () => {
    expect(parseGradient('radial-gradient(#000, #fff)')).toMatchObject({ shape: 'ellipse', position: 'center' })
  })
})

describe('serializeGradient', () => {
  it('round-trips a linear gradient', () => {
    const css = 'linear-gradient(45deg, #ff0000 0%, #0000ff 100%)'
    expect(serializeGradient(parseGradient(css)!)).toBe(css)
  })

  it('round-trips a radial gradient', () => {
    const css = 'radial-gradient(circle at center, #000000 0%, #ffffff 100%)'
    expect(serializeGradient(parseGradient(css)!)).toBe(css)
  })

  it('keeps stop ids stable across re-parses', () => {
    const css = 'linear-gradient(90deg, #000 0%, #fff 100%)'
    expect(parseGradient(css)!.stops.map(s => s.id)).toEqual(parseGradient(css)!.stops.map(s => s.id))
  })
})
