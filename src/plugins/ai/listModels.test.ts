import { describe, expect, it } from 'vitest'
import { DEFAULT_OPENAI_BASE_URL, normalizeOpenAiBaseUrl } from './listModels'

describe('normalizeOpenAiBaseUrl', () => {
  it('uses the default for an empty input and trims trailing slashes', () => {
    expect(normalizeOpenAiBaseUrl()).toBe(DEFAULT_OPENAI_BASE_URL)
    expect(normalizeOpenAiBaseUrl('  https://provider.example/v1///  ')).toBe('https://provider.example/v1')
  })
})
