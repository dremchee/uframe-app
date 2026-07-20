import { describe, expect, it } from 'vitest'
import { CSS_SIZING_UNITS, formatLength, isCssExpression, isValidLengthInput, parseLength, UNITLESS } from './units'

describe('isValidLengthInput', () => {
  it('accepts a finite number with a measurement unit', () => {
    expect(isValidLengthInput('12', 'px')).toBe(true)
    expect(isValidLengthInput('1.5', 'fr')).toBe(true)
    expect(isValidLengthInput('.5', 'rem')).toBe(true)
    expect(isValidLengthInput('-3', 'px')).toBe(true) // negative ok without a min
  })

  it('accepts empty (clears) and keyword units', () => {
    expect(isValidLengthInput('', 'px')).toBe(true)
    expect(isValidLengthInput('   ', 'fr')).toBe(true)
    expect(isValidLengthInput('', 'auto')).toBe(true)
    expect(isValidLengthInput('anything', 'auto')).toBe(true) // keyword ignores the number
  })

  it('rejects non-numeric input', () => {
    expect(isValidLengthInput('abc', 'fr')).toBe(false)
    expect(isValidLengthInput('12px', 'px')).toBe(false) // unit belongs in the dropdown
    expect(isValidLengthInput('1.2.3', 'px')).toBe(false)
    expect(isValidLengthInput('Infinity', 'px')).toBe(false)
  })

  it('rejects non-decimal number literals Number() would accept', () => {
    // These all coerce to finite numbers via Number(), but aren't valid CSS.
    expect(isValidLengthInput('0x10', 'px')).toBe(false)
    expect(isValidLengthInput('0b101', 'px')).toBe(false)
    expect(isValidLengthInput('0o17', 'px')).toBe(false)
    expect(isValidLengthInput('1e3', 'px')).toBe(false)
  })

  it('rejects values below min (e.g. negative sizes / gaps)', () => {
    expect(isValidLengthInput('-1', 'fr', 0)).toBe(false)
    expect(isValidLengthInput('0', 'fr', 0)).toBe(true)
    expect(isValidLengthInput('5', 'px', 0)).toBe(true)
  })
})

// Guards the round-trip the validity check sits in front of.
describe('parseLength / formatLength round-trip', () => {
  it('keeps a bare number unitless', () => {
    expect(parseLength('1.5')).toEqual({ number: '1.5', unit: UNITLESS })
    expect(formatLength('1.5', UNITLESS)).toBe('1.5')
  })
})

describe('isCssExpression', () => {
  it('recognizes complete CSS functions used by size properties', () => {
    expect(isCssExpression('minmax(0, 1fr)')).toBe(true)
    expect(isCssExpression('clamp(1rem, 2vw, 3rem)')).toBe(true)
    expect(isCssExpression('var(--space-4)')).toBe(true)
    expect(isCssExpression('env(safe-area-inset-top)')).toBe(true)
  })

  it('does not mistake scalar values or incomplete functions for expressions', () => {
    expect(isCssExpression('24px')).toBe(false)
    expect(isCssExpression('min-content')).toBe(false)
    expect(isCssExpression('calc(100% - 1rem')).toBe(false)
  })
})

describe('CSS_SIZING_UNITS', () => {
  it('includes modern viewport, container and physical units', () => {
    expect(CSS_SIZING_UNITS.map(unit => unit.value)).toEqual(expect.arrayContaining(['dvw', 'cqw', 'cm', 'q']))
  })
})
