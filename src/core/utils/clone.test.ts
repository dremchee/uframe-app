import { describe, expect, it } from 'vitest'
import { cloneJsonValue } from './clone'

describe('cloneJsonValue', () => {
  it('creates an independent deep clone using JSON semantics', () => {
    const source = { nested: { value: 1 }, omitted: undefined }
    const clone = cloneJsonValue(source)
    clone.nested.value = 2

    expect(source.nested.value).toBe(1)
    expect(clone).toEqual({ nested: { value: 2 } })
  })
})
