import type { PageDocument } from '@/core'
import { describe, expect, it } from 'vitest'
import { anchorFlipState, anchorNameForBlock, collectAnchorCandidates, composeAnchorFallbacks, isAnchorName, normalizeAnchorName } from './anchor-css'

describe('cSS anchor helpers', () => {
  it('normalizes and validates portable anchor names', () => {
    expect(normalizeAnchorName('Menu Trigger')).toBe('--menu-trigger')
    expect(normalizeAnchorName('--Already_valid')).toBe('--already_valid')
    expect(normalizeAnchorName('42')).toBe('--anchor-42')
    expect(anchorNameForBlock('button.42')).toBe('--anchor-button-42')
    expect(isAnchorName('--menu-trigger')).toBe(true)
    expect(isAnchorName('menu-trigger')).toBe(false)
  })

  it('composes flip tactics for one or both axes', () => {
    expect(composeAnchorFallbacks(false, false)).toBeUndefined()
    expect(composeAnchorFallbacks(true, false)).toBe('flip-block')
    expect(composeAnchorFallbacks(false, true)).toBe('flip-inline')
    expect(composeAnchorFallbacks(true, true)).toBe('flip-block, flip-inline, flip-block flip-inline')
    expect(anchorFlipState('flip-block, flip-inline, flip-block flip-inline')).toEqual({
      'flip-block': true,
      'flip-inline': true,
    })
  })

  it('collects local and class-authored anchor names', () => {
    const document = {
      blocks: [
        { id: 'local', type: 'button', name: 'Trigger', props: {}, style: { anchorName: '--local' } },
        { id: 'classed', type: 'div', props: {}, classes: ['anchor'] },
      ],
      styles: { anchor: { anchorName: '--shared' } },
    } as unknown as PageDocument

    expect(collectAnchorCandidates(document)).toEqual([
      { name: '--local', blockId: 'local', blockName: 'Trigger', blockType: 'button' },
      { name: '--shared', blockId: 'classed', blockName: undefined, blockType: 'div' },
    ])
  })
})
