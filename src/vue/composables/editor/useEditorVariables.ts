import type { ShallowRef } from 'vue'
import type { CssVariable, GlobalSettings, PageDocument } from '@/core'
import { computed } from 'vue'
import { appendListItem, createUniqueName, moveListItem, removeListItem, replaceListItem, rewriteStyleVarRefs, sanitizeVarName } from '@/core'

export interface UseEditorVariablesOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
  commitBoth: (document: PageDocument, globals: GlobalSettings, label?: string) => void
}

/**
 * Owns CSS custom-property edits. Variables belong to shared globals when
 * available; otherwise they remain local to the active page document.
 */
export function useEditorVariables(options: UseEditorVariablesOptions) {
  const { document, globals, commit, commitGlobals, commitBoth } = options
  const variables = computed<CssVariable[]>(() =>
    globals.value ? (globals.value.variables ?? []) : (document.value.variables ?? []),
  )

  function commitVariables(next: CssVariable[]) {
    if (globals.value)
      commitGlobals({ ...globals.value, variables: next })
    else
      commit({ ...document.value, variables: next })
  }

  function addVariable(input: Partial<CssVariable> = {}): string {
    const type = input.type ?? 'color'
    const base = sanitizeVarName(input.name ?? input.key ?? '') || sanitizeVarName(`var-${variables.value.length + 1}`) || 'var'
    const key = createUniqueName(base, variables.value.map(variable => variable.key))
    const name = input.name?.trim() || key
    commitVariables(appendListItem(variables.value, { key, name, value: input.value ?? '', type }))
    return key
  }

  function updateVariable(index: number, patch: Partial<CssVariable>): boolean {
    const current = variables.value[index]
    if (!current)
      return false

    const next = { ...current }
    if (patch.name !== undefined) {
      const label = patch.name.trim()
      if (!label)
        return false
      next.name = label
      // The display label is the source of truth for the custom-property name.
      // CSS identifiers are lowercase kebab-case; an invalid label keeps the
      // existing key, so an already usable variable cannot become invalid.
      const base = sanitizeVarName(label).toLowerCase() || current.key
      next.key = createUniqueName(base, variables.value.filter((_, candidateIndex) => candidateIndex !== index).map(variable => variable.key))
    }
    if (patch.value !== undefined)
      next.value = patch.value
    if (patch.type !== undefined)
      next.type = patch.type
    if (next.key === current.key && next.name === current.name && next.value === current.value && next.type === current.type)
      return true

    const nextVariables = rewriteStyleVarRefs(replaceListItem(variables.value, index, next), current.key, next.key)
    if (next.key === current.key) {
      commitVariables(nextVariables)
      return true
    }

    // Changing the CSS key also updates every current var(--key) reference,
    // including nested state, class and symbol styles.
    const rewrittenDocument = rewriteStyleVarRefs(document.value, current.key, next.key)
    if (globals.value) {
      commitBoth(rewrittenDocument, { ...globals.value, variables: nextVariables })
    }
    else {
      commit({ ...rewrittenDocument, variables: nextVariables })
    }
    return true
  }

  function renameVariable(index: number, name: string): boolean {
    return updateVariable(index, { name })
  }

  function removeVariable(index: number): boolean {
    if (index < 0 || index >= variables.value.length)
      return false
    commitVariables(removeListItem(variables.value, index))
    return true
  }

  function reorderVariables(from: number, to: number): boolean {
    const list = variables.value
    if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to)
      return false
    commitVariables(moveListItem(list, from, to))
    return true
  }

  return {
    variables,
    addVariable,
    updateVariable,
    renameVariable,
    removeVariable,
    reorderVariables,
  }
}
