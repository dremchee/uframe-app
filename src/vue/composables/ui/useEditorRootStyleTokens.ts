import type { ComputedRef } from 'vue'
import { onBeforeUnmount, watch } from 'vue'

/**
 * Mirrors editor tokens onto `<html>` so teleported dialogs and selects inherit
 * the same palette as `.uf-editor`, then restores pre-existing inline values.
 */
export function useEditorRootStyleTokens(tokens: ComputedRef<Record<string, string>>) {
  if (typeof document === 'undefined')
    return

  const root = document.documentElement
  const initial = new Map<string, string>()
  const applied = new Set<string>()

  const stop = watch(tokens, (next) => {
    for (const property of applied) {
      if (!(property in next)) {
        root.style.setProperty(property, initial.get(property) ?? '')
        applied.delete(property)
      }
    }
    for (const [property, value] of Object.entries(next)) {
      if (!initial.has(property))
        initial.set(property, root.style.getPropertyValue(property))
      root.style.setProperty(property, value)
      applied.add(property)
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    stop()
    for (const property of applied)
      root.style.setProperty(property, initial.get(property) ?? '')
  })
}
