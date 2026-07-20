import { describe, expect, it } from 'vitest'
import { fontFamilyStack, fontStylesheetLinks, isSystemFontValue, renderFontHead, SYSTEM_FONT_STACKS } from '@/core/utils/fonts'

describe('fonts', () => {
  it('wraps a family into a fallback stack, quoting multi-word names', () => {
    expect(fontFamilyStack('Roboto')).toBe('Roboto, sans-serif')
    expect(fontFamilyStack('Open Sans')).toBe('"Open Sans", sans-serif')
    expect(fontFamilyStack('  ')).toBe('')
  })

  it('recognises the built-in system stacks', () => {
    expect(isSystemFontValue(SYSTEM_FONT_STACKS[0]!.value)).toBe(true)
    expect(isSystemFontValue('Roboto, sans-serif')).toBe(false)
  })

  it('builds one Google css2 link for all google families with weights, styles and subsets', () => {
    expect(fontStylesheetLinks([
      { family: 'Open Sans', provider: 'google', weights: [700, 400] },
      { family: 'Roboto', provider: 'google', styles: ['normal', 'italic'], weights: [400], subsets: ['cyrillic', 'latin'] },
    ])).toEqual([
      'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Roboto:ital,wght@0,400;1,400&subset=cyrillic,latin&display=swap',
    ])
  })

  it('requests only italic faces when normal is not among the styles', () => {
    expect(fontStylesheetLinks([{ family: 'Roboto', provider: 'google', styles: ['italic'], weights: [400] }]))
      .toEqual(['https://fonts.googleapis.com/css2?family=Roboto:ital,wght@1,400&display=swap'])
  })

  it('emits a separate link per provider, deduped custom urls, and skips local', () => {
    const links = fontStylesheetLinks([
      { family: 'Roboto', provider: 'google', weights: [400] },
      { family: 'Fraunces', provider: 'bunny', weights: [400] },
      { family: 'Chalkduster', provider: 'local' },
      { family: 'Brand', provider: 'custom', url: 'https://cdn.example/brand.css' },
      { family: 'Brand Alt', provider: 'custom', url: 'https://cdn.example/brand.css' },
    ])
    expect(links).toEqual([
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
      'https://fonts.bunny.net/css?family=fraunces:400&display=swap',
      'https://cdn.example/brand.css',
    ])
  })

  it('returns nothing when only local fonts are registered', () => {
    expect(fontStylesheetLinks([{ family: 'Chalkduster', provider: 'local' }])).toEqual([])
    expect(renderFontHead({ families: [{ family: 'Chalkduster', provider: 'local' }] })).toBe('')
    expect(renderFontHead({ families: [{ family: 'Roboto', provider: 'google' }] })).toContain('<link rel="stylesheet"')
  })
})
