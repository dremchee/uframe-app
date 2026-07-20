import type { HSVA } from './color'
import { describe, expect, it } from 'vitest'
import {
  detectColorFormat,
  formatColor,
  getChannels,

  parseColor,
  setChannel,
  toHex,
} from './color'

function hsva(h: number, s: number, v: number, a = 1): HSVA {
  return { h, s, v, a }
}

describe('detectColorFormat', () => {
  it('detects each notation from its syntax', () => {
    expect(detectColorFormat('#f9fafc')).toBe('hex')
    expect(detectColorFormat('rgb(255 0 0)')).toBe('rgb')
    expect(detectColorFormat('rgba(255, 0, 0, 0.5)')).toBe('rgb')
    expect(detectColorFormat('hsl(120 50% 50%)')).toBe('hsl')
    expect(detectColorFormat('hsla(120, 50%, 50%, 0.5)')).toBe('hsl')
    expect(detectColorFormat('oklch(98.49% 0.0029 264.54)')).toBe('oklch')
    expect(detectColorFormat('color(display-p3 1 0 0)')).toBe('p3')
  })

  it('tolerates surrounding whitespace', () => {
    expect(detectColorFormat('  oklch(50% 0.1 200)  ')).toBe('oklch')
    expect(detectColorFormat(' rgb(0 0 0) ')).toBe('rgb')
  })

  // Detection follows culori (the picker's parser): what parseColor can't
  // read, detectColorFormat doesn't classify.
  it('mirrors parseColor for input the parser rejects', () => {
    expect(parseColor('OKLCH(50% 0.1 200)')).toBeNull()
    expect(detectColorFormat('OKLCH(50% 0.1 200)')).toBeNull()
  })

  it('returns null when the notation is not pinned down', () => {
    expect(detectColorFormat('')).toBeNull()
    expect(detectColorFormat('red')).toBeNull()
    expect(detectColorFormat('var(--brand)')).toBeNull()
  })
})

describe('parseColor', () => {
  it('parses hex', () => {
    expect(parseColor('#ff0000')).toMatchObject({ h: 0, s: 100, v: 100, a: 1 })
    expect(parseColor('#000000')).toMatchObject({ s: 0, v: 0, a: 1 })
  })

  it('parses short hex and hex with alpha', () => {
    expect(parseColor('#f00')).toMatchObject({ h: 0, s: 100, v: 100 })
    expect(parseColor('#ff000080')?.a).toBeCloseTo(0.5, 1)
  })

  it('parses rgb / rgba', () => {
    expect(parseColor('rgb(0, 0, 255)')).toMatchObject({ h: 240, s: 100, v: 100 })
    expect(parseColor('rgba(0, 0, 0, 0.5)')?.a).toBeCloseTo(0.5)
  })

  it('parses hsl, oklch and display-p3', () => {
    expect(parseColor('hsl(120, 100%, 50%)')).toMatchObject({ h: 120, s: 100, v: 100 })
    expect(parseColor('oklch(0.7 0.15 30)')).not.toBeNull()
    expect(parseColor('color(display-p3 1 0 0)')).not.toBeNull()
  })

  it('returns null for garbage', () => {
    expect(parseColor('not-a-color')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('formatColor', () => {
  const red = hsva(0, 100, 100)

  it('formats each space', () => {
    expect(formatColor(red, 'hex')).toBe('#ff0000')
    expect(formatColor(red, 'rgb')).toBe('rgb(255, 0, 0)')
    expect(formatColor(red, 'hsl')).toBe('hsl(0, 100%, 50%)')
    expect(formatColor(red, 'oklch')).toMatch(/^oklch\(/)
    expect(formatColor(red, 'p3')).toMatch(/^color\(display-p3 /)
  })

  it('emits alpha variants when translucent', () => {
    const t = hsva(0, 100, 100, 0.5)
    expect(formatColor(t, 'hex')).toBe('#ff000080')
    expect(formatColor(t, 'rgb')).toBe('rgba(255, 0, 0, 0.5)')
    expect(formatColor(t, 'oklch')).toContain('/ 0.5')
    expect(formatColor(t, 'p3')).toContain('/ 0.5')
  })
})

describe('round-trips', () => {
  const samples = ['#3399ff', '#1a2b3c', '#ffffff', '#000000', '#7f00ff']
  it('hex → parse → toHex is stable', () => {
    for (const hex of samples)
      expect(toHex(parseColor(hex)!, false)).toBe(hex)
  })
})

describe('channel editing', () => {
  it('lists channels per format', () => {
    const c = parseColor('#3399ff')!
    expect(getChannels(c, 'rgb').map(x => x.label)).toEqual(['R', 'G', 'B'])
    expect(getChannels(c, 'hsl').map(x => x.label)).toEqual(['H', 'S', 'L'])
    expect(getChannels(c, 'oklch').map(x => x.label)).toEqual(['L', 'C', 'H'])
    expect(getChannels(c, 'p3').map(x => x.label)).toEqual(['R', 'G', 'B'])
    expect(getChannels(c, 'hex')).toEqual([])
  })

  it('sets an rgb channel', () => {
    const c = parseColor('#000000')!
    const next = setChannel(c, 'rgb', 'r', 255)
    expect(toHex(next, false)).toBe('#ff0000')
  })

  it('keeps hue when an edit produces grey', () => {
    const c = parseColor('#3399ff')! // hue 210
    const grey = setChannel(c, 'hsl', 's', 0) // saturation 0 → exact grey
    expect(grey.s).toBe(0)
    expect(grey.h).toBe(c.h) // hue preserved, not snapped to 0
  })

  it('gamut-maps out-of-sRGB oklch chroma', () => {
    const c = parseColor('#808080')!
    const next = setChannel(c, 'oklch', 'c', 0.4) // far outside sRGB
    // result must still be a valid sRGB colour the HSV model can hold
    expect(next.s).toBeGreaterThanOrEqual(0)
    expect(next.s).toBeLessThanOrEqual(100)
    expect(Number.isFinite(next.v)).toBe(true)
  })
})
