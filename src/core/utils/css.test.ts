import { describe, expect, it } from 'vitest'
import { cssToObject, objectToCss, parseCssPixels } from '@/core/utils/css'

describe('parseCssPixels', () => {
  it('reads resolved numeric CSS values and handles invalid input', () => {
    expect(parseCssPixels('12.5px')).toBe(12.5)
    expect(parseCssPixels('-3px')).toBe(-3)
    expect(parseCssPixels('auto')).toBe(0)
    expect(parseCssPixels(undefined, 16)).toBe(16)
  })
})

describe('cssToObject', () => {
  it('camelCases regular properties', () => {
    expect(cssToObject('background-color: red; border-left: 1px')).toEqual({
      backgroundColor: 'red',
      borderLeft: '1px',
    })
  })

  it('keeps custom properties as-is', () => {
    expect(cssToObject('--brand: #fff; color: var(--brand)')).toEqual({
      '--brand': '#fff',
      'color': 'var(--brand)',
    })
  })

  it('preserves colons inside values', () => {
    expect(cssToObject('background: var(--bg, #eee); content: url(data:image/png)')).toEqual({
      background: 'var(--bg, #eee)',
      content: 'url(data:image/png)',
    })
  })

  it('ignores empty / malformed declarations', () => {
    expect(cssToObject(';; color:red ;no-colon; :no-prop')).toEqual({ color: 'red' })
  })
})

describe('objectToCss', () => {
  it('kebab-cases keys and joins declarations', () => {
    expect(objectToCss({ backgroundColor: 'red', borderLeft: '1px' })).toBe('background-color:red;border-left:1px')
  })

  it('emits custom properties verbatim and skips empties', () => {
    expect(objectToCss({ '--brand': '#fff', 'color': '', 'opacity': 0 })).toBe('--brand:#fff;opacity:0')
  })
})
