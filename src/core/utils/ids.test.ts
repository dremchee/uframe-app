import { describe, expect, it } from 'vitest'
import { createShortId, createUniqueId, createUniqueName } from './ids'

describe('id utilities', () => {
  it('creates a compact prefixed id for document entities', () => {
    expect(createShortId('node')).toMatch(/^node_[\da-f]{8}$/)
  })

  it('creates a prefixed unique id for independently managed entries', () => {
    expect(createUniqueId('shadow')).toMatch(/^shadow_/)
    expect(createUniqueId('shadow')).not.toBe(createUniqueId('shadow'))
  })

  it('adds the first available numeric suffix to readable names', () => {
    expect(createUniqueName('content', ['content', 'content-2', 'content-4'])).toBe('content-3')
    expect(createUniqueName('bp', ['bp', 'bp2'], '')).toBe('bp3')
  })
})
