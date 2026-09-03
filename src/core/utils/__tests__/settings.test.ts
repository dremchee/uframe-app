import type { BlockDefinition } from '@/core/types/block-registry'
import { describe, expect, it } from 'vitest'
import { resolveSettingsFields } from '@/core/utils/settings'

function def(partial: Partial<BlockDefinition>): BlockDefinition {
  return { type: 't', label: 'T', defaultProps: {}, ...partial } as BlockDefinition
}

describe('resolveSettingsFields', () => {
  it('returns null when settings is not set', () => {
    expect(resolveSettingsFields(def({}))).toBeNull()
    expect(resolveSettingsFields(undefined)).toBeNull()
  })

  it('returns an explicit field list as-is', () => {
    const fields = [{ key: 'tone', type: 'select' as const, options: [{ label: 'Info', value: 'info' }] }]
    expect(resolveSettingsFields(def({ settings: fields }))).toBe(fields)
  })

  it('infers field types from defaultProps for "auto"', () => {
    const fields = resolveSettingsFields(def({
      settings: 'auto',
      defaultProps: { text: 'hi', count: 2, on: true },
    }))
    expect(fields).toEqual([
      { key: 'text', type: 'text' },
      { key: 'count', type: 'number' },
      { key: 'on', type: 'boolean' },
    ])
  })
})
