import { describe, expect, it } from 'vitest'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { BLOCK_CONVERSIONS } from '@/core'

const types = new Set(defaultBlockDefinitions.map(definition => definition.type))

describe('block conversions against the default registry', () => {
  it('converts only into types the registry actually has', () => {
    const dangling = BLOCK_CONVERSIONS.filter(conversion => !types.has(conversion.to))
    expect(dangling.map(conversion => `${conversion.from} -> ${conversion.to}`)).toEqual([])
  })

  it('never retires a type that is still registered', () => {
    // Re-registering a retired name would silently rewrite live blocks on load.
    const resurrected = BLOCK_CONVERSIONS.filter(conversion => types.has(conversion.from))
    expect(resurrected.map(conversion => conversion.from)).toEqual([])
  })
})
