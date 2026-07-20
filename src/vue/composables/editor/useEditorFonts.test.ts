import type { GlobalSettings } from '@/core'
import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { createPageDocument } from '@/core'
import { useEditorFonts } from './useEditorFonts'

function createFonts(globalsValue: GlobalSettings | null = null) {
  const document = shallowRef(createPageDocument({ title: 'Document' }))
  const globals = shallowRef<GlobalSettings | null>(globalsValue)
  const fonts = useEditorFonts({
    document,
    globals,
    commit: (next) => { document.value = next },
    commitGlobals: (next) => { globals.value = next },
  })
  return { document, globals, fonts }
}

describe('useEditorFonts', () => {
  it('normalizes a font entry and prevents duplicate families regardless of case', () => {
    const state = createFonts()

    expect(state.fonts.addFont({
      family: ' Inter ',
      provider: 'custom',
      weights: [],
      url: ' https://fonts.example/inter.css ',
    })).toBe(true)
    expect(state.fonts.addFont({ family: 'inter', provider: 'google' })).toBe(false)
    expect(state.fonts.fonts.value).toEqual([{
      family: 'Inter',
      provider: 'custom',
      url: 'https://fonts.example/inter.css',
    }])
  })

  it('writes shared font changes to globals and removes the empty config', () => {
    const state = createFonts({
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      fonts: { families: [{ family: 'Inter', provider: 'google' }] },
    })

    expect(state.fonts.removeFont(0)).toBe(true)

    expect(state.globals.value?.fonts).toBeUndefined()
    expect(state.document.value.fonts).toBeUndefined()
  })
})
