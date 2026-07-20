import type { ShallowRef } from 'vue'
import type { BlockStyles, GlobalSettings, PageDocument, SymbolDefinition } from '@/core'

export interface UseEditorSharedContextOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
}

/**
 * Routes definitions shared by a page set to globals when present and to the
 * document otherwise. Block references and symbol instances always remain on
 * the document; only their shared definitions use this context.
 */
export function useEditorSharedContext(options: UseEditorSharedContextOptions) {
  const { document, globals, commit, commitGlobals } = options

  function activeStyles(): Record<string, BlockStyles> {
    return (globals.value ? globals.value.styles : document.value.styles) ?? {}
  }

  function activeSymbols(): Record<string, SymbolDefinition> {
    return (globals.value ? globals.value.symbols : document.value.symbols) ?? {}
  }

  function commitSymbols(
    symbols: Record<string, SymbolDefinition> | undefined,
    label = 'history.edit',
  ) {
    if (globals.value)
      commitGlobals({ ...globals.value, symbols }, label)
    else
      commit({ ...document.value, symbols }, label)
  }

  function setGlobalDefaults(patch: Partial<NonNullable<GlobalSettings['defaults']>>): boolean {
    if (!globals.value)
      return false
    commitGlobals(
      { ...globals.value, defaults: { ...globals.value.defaults, ...patch } },
      'history.globalDefaults',
      true,
    )
    return true
  }

  return { activeStyles, activeSymbols, commitSymbols, setGlobalDefaults }
}
