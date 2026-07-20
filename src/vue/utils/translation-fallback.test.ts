import { describe, expect, it } from 'vitest'
import { localizedLabel, localizedPlaceholder, translatedOrFallback } from './translation-fallback'

describe('translatedOrFallback', () => {
  const t = (key: string) => key === 'known' ? 'Переведено' : key

  it('uses the translated value when the key exists', () => {
    expect(translatedOrFallback('known', 'Fallback', t)).toBe('Переведено')
  })

  it('keeps the fallback when a key is missing or omitted', () => {
    expect(translatedOrFallback('missing', 'Fallback', t)).toBe('Fallback')
    expect(translatedOrFallback(undefined, 'Fallback', t)).toBe('Fallback')
  })

  it('reads labels and placeholders from their common localization metadata', () => {
    expect(localizedLabel({ label: 'Fallback', labelKey: 'known' }, t)).toBe('Переведено')
    expect(localizedLabel({ label: 'Fallback', labelKey: 'missing' }, t)).toBe('Fallback')
    expect(localizedPlaceholder({ placeholder: 'Choose', placeholderKey: 'known' }, t)).toBe('Переведено')
  })
})
