import type { CssVariable, CssVarType } from '@/core'
import { computed } from 'vue'
import { resolveVarValue } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'

/**
 * Reactive access to the document's custom properties for the style-field token
 * pickers: the variable list, lookup by name, type filtering, and `var(--x)`
 * resolution for previews (e.g. a colour swatch).
 */
export function useVariableResolver() {
  const { editor } = useEditorContext()

  const variables = computed<CssVariable[]>(() => editor.variables.value)

  // Keyed by the stable CSS `key` — that's what `var(--key)` references resolve
  // through, independent of the editable display `name`.
  const byKey = computed(() => {
    const map = new Map<string, string>()
    for (const variable of variables.value)
      map.set(variable.key, variable.value)
    return map
  })

  /** Look up a variable by its stable CSS key (what `parseVarRef` returns). */
  function get(key: string): CssVariable | undefined {
    return variables.value.find(v => v.key === key)
  }

  function ofType(type: CssVarType): CssVariable[] {
    return variables.value.filter(v => v.type === type)
  }

  function resolve(value: string): string {
    return resolveVarValue(value, byKey.value)
  }

  /** Create a variable and return its (uniquified) stable key for binding. */
  function add(input: Partial<CssVariable>): string {
    return editor.addVariable(input)
  }

  return { variables, byKey, get, ofType, resolve, add }
}
