import { describe, expect, it } from 'vitest'
import { calculateContrast } from './contrast'

describe('calculateContrast', () => {
  it('calculates black on white as WCAG AAA', () => {
    expect(calculateContrast('#000', '#fff')).toEqual({ ratio: 21, level: 'aaa' })
  })

  it('parses modern CSS color syntax', () => {
    const result = calculateContrast('oklch(0.2 0 0)', 'hsl(0 0% 100%)')
    expect(result?.ratio).toBeGreaterThan(12)
    expect(result?.level).toBe('aaa')
  })

  it('composites a transparent foreground over its solid background', () => {
    const result = calculateContrast('rgb(0 0 0 / 50%)', '#fff')
    expect(result?.ratio).toBeCloseTo(3.98, 2)
    expect(result?.level).toBe('fail')
  })

  it('does not guess contrast over a transparent or unresolved color', () => {
    expect(calculateContrast('#000', 'rgb(255 255 255 / 50%)')).toBeNull()
    expect(calculateContrast('var(--ink)', '#fff')).toBeNull()
  })
})
