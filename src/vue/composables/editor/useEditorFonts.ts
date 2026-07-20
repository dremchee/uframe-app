import type { ShallowRef } from 'vue'
import type { FontConfig, FontDef, GlobalSettings, PageDocument } from '@/core'
import { computed } from 'vue'
import { appendListItem, removeListItem, replaceListItem } from '@/core'

export interface UseEditorFontsOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
}

/**
 * Owns the registered font families. Fonts are shared through globals when a
 * page set has them, and otherwise remain a document-level concern.
 */
export function useEditorFonts(options: UseEditorFontsOptions) {
  const { document, globals, commit, commitGlobals } = options
  const fontConfig = computed<FontConfig>(() =>
    globals.value ? (globals.value.fonts ?? {}) : (document.value.fonts ?? {}),
  )
  const fonts = computed<FontDef[]>(() => fontConfig.value.families ?? [])

  function commitFonts(next: FontDef[], label = 'history.fonts') {
    const value: FontConfig | undefined = next.length ? { families: next } : undefined
    if (globals.value)
      commitGlobals({ ...globals.value, fonts: value }, label)
    else
      commit({ ...document.value, fonts: value }, label)
  }

  function addFont(font: FontDef): boolean {
    const family = font.family.trim()
    if (!family || fonts.value.some(existing => existing.family.toLowerCase() === family.toLowerCase()))
      return false

    const entry: FontDef = {
      family,
      provider: font.provider,
      ...(font.weights?.length ? { weights: font.weights } : {}),
      ...(font.styles?.length ? { styles: font.styles } : {}),
      ...(font.subsets?.length ? { subsets: font.subsets } : {}),
      ...(font.url?.trim() ? { url: font.url.trim() } : {}),
    }
    commitFonts(appendListItem(fonts.value, entry))
    return true
  }

  function updateFont(index: number, patch: Partial<FontDef>): boolean {
    const current = fonts.value[index]
    if (!current)
      return false
    commitFonts(replaceListItem(fonts.value, index, {
      ...current,
      ...patch,
      family: (patch.family ?? current.family).trim() || current.family,
    }))
    return true
  }

  function removeFont(index: number): boolean {
    if (index < 0 || index >= fonts.value.length)
      return false
    commitFonts(removeListItem(fonts.value, index))
    return true
  }

  return {
    fontConfig,
    fonts,
    addFont,
    updateFont,
    removeFont,
  }
}
