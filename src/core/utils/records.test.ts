import { describe, expect, it } from 'vitest'
import { isRecord } from './records'

describe('isRecord', () => {
  it('excludes arrays, null, and primitives', () => {
    expect(isRecord({ value: 1 })).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('value')).toBe(false)
  })
})
