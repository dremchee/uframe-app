import { describe, expect, it } from 'vitest'
import { parseShadowString, serializeShadows } from '@/core/utils/css-shadows'

describe('parseShadowString', () => {
  it('returns no shadows for empty / none', () => {
    expect(parseShadowString('')).toEqual([])
    expect(parseShadowString(undefined)).toEqual([])
    expect(parseShadowString('none')).toEqual([])
  })

  it('parses a single layer (lengths + rgba color with commas)', () => {
    expect(parseShadowString('0 2px 5px 0 rgba(0, 0, 0, 0.2)')).toEqual([
      { id: 'sh-0', enabled: true, inset: false, x: 0, y: 2, blur: 5, spread: 0, color: 'rgba(0, 0, 0, 0.2)' },
    ])
  })

  it('parses inset and multiple comma-separated layers', () => {
    const parsed = parseShadowString('inset 0 1px 2px 1px #000, 0 10px 30px 0 rgba(15, 23, 42, 0.08)')
    expect(parsed).toEqual([
      { id: 'sh-0', enabled: true, inset: true, x: 0, y: 1, blur: 2, spread: 1, color: '#000' },
      { id: 'sh-1', enabled: true, inset: false, x: 0, y: 10, blur: 30, spread: 0, color: 'rgba(15, 23, 42, 0.08)' },
    ])
  })

  it('round-trips through serializeShadows', () => {
    const css = '0px 2px 5px 0px rgba(0, 0, 0, 0.2), inset 1px 1px 0px 0px #fff'
    expect(serializeShadows(parseShadowString(css))).toBe(css)
  })

  it('keeps ids stable across re-parses of the same string', () => {
    const css = '0 2px 5px 0 #000'
    expect(parseShadowString(css).map(s => s.id)).toEqual(parseShadowString(css).map(s => s.id))
  })
})
