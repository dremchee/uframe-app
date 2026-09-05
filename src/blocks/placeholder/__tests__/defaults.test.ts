import { describe, expect, it } from 'vitest'
import { placeholderLabel, placeholderRatio } from '@/blocks/placeholder/render'

describe('placeholder defaults', () => {
  it.each([
    ['box', 'Box', 'auto'],
    ['image', 'Image', '16:9'],
    ['text', 'Text', 'auto'],
    ['avatar', 'Avatar', '1:1'],
    ['video', 'Video', '16:9'],
  ] as const)('uses defaults for %s until explicitly edited', (kind, label, ratio) => {
    expect(placeholderLabel({ kind })).toBe(label)
    expect(placeholderRatio({ kind })).toBe(ratio)
  })
  it('preserves custom values, even when they equal a previous default', () => {
    const edited = { label: 'Image', ratio: '16:9' as const }
    expect(placeholderLabel({ ...edited, kind: 'text' })).toBe('Image')
    expect(placeholderRatio({ ...edited, kind: 'text' })).toBe('16:9')
    expect(placeholderLabel({ kind: 'text', label: '' })).toBe('')
    expect(placeholderRatio({ kind: 'image', ratio: 'auto' })).toBe('auto')
  })
})
