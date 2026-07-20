import { describe, expect, it } from 'vitest'
import { deepMergeRecord } from './deep-merge'

describe('deepMergeRecord', () => {
  it('merges nested records without mutating either input', () => {
    const base = { editor: { save: 'Save', cancel: 'Cancel' } }
    const override = { editor: { save: 'Сохранить' } }

    expect(deepMergeRecord(base, override)).toEqual({ editor: { save: 'Сохранить', cancel: 'Cancel' } })
    expect(base).toEqual({ editor: { save: 'Save', cancel: 'Cancel' } })
    expect(override).toEqual({ editor: { save: 'Сохранить' } })
  })

  it('replaces arrays, null values, and primitives as leaves', () => {
    expect(deepMergeRecord(
      { data: { items: ['base'], value: 'base', nested: { keep: true } } },
      { data: { items: ['override'], value: null, nested: 'replace' } },
    )).toEqual({ data: { items: ['override'], value: null, nested: 'replace' } })
  })
})
