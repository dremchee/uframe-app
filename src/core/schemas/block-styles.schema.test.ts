import { describe, expect, it } from 'vitest'
import { baseBlockStylesSchema } from './block-styles.schema'

describe('baseBlockStylesSchema CSS anchors', () => {
  it('preserves anchor positioning declarations', () => {
    const value = {
      anchorName: '--menu-trigger',
      anchorScope: '--menu-trigger',
      position: 'fixed',
      positionAnchor: '--menu-trigger',
      positionArea: 'bottom span-right',
      positionTryFallbacks: 'flip-block',
      positionTryOrder: 'most-width',
      positionVisibility: 'anchor-visible no-overflow',
    }

    expect(baseBlockStylesSchema.parse(value)).toEqual(value)
  })
})
