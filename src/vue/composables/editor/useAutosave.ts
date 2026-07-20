import type { Ref } from 'vue'
import type { EditorStorageAdapter, PageDocument } from '@/core'
import { useDebounceFn } from '@vueuse/core'
import { shallowRef, watch } from 'vue'

/** Resolve a draft synchronously if the adapter's load() is synchronous. */
export function loadAutosavedDocument(
  source: EditorStorageAdapter | undefined,
): PageDocument | null {
  if (!source)
    return null

  const result = source.load()
  return result instanceof Promise ? null : (result ?? null)
}

export interface UseAutosaveOptions {
  debounceMs?: number
  onSave?: (document: PageDocument) => void
  /**
   * When this returns true, persistence is skipped. Used to avoid saving
   * transient editor states (e.g. while editing a symbol the document holds
   * only the symbol's root, not the page — persisting it would strand the
   * user in edit mode after a reload).
   */
  paused?: () => boolean
}

/**
 * Watches `document` and persists it through the provided storage adapter
 * (debounced) through one storage adapter contract.
 */
export function useAutosave(
  document: Ref<PageDocument>,
  source: EditorStorageAdapter | undefined,
  options: UseAutosaveOptions = {},
) {
  const lastSavedAt = shallowRef<number | null>(null)
  const error = shallowRef<Error | null>(null)

  if (!source) {
    return { lastSavedAt, error, flush: () => {}, clear: () => {} }
  }

  const persist = useDebounceFn(async () => {
    if (options.paused?.())
      return
    try {
      await source.save(document.value)
      lastSavedAt.value = Date.now()
      error.value = null
      options.onSave?.(document.value)
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause : new Error(String(cause))
    }
  }, options.debounceMs ?? 300)

  watch(document, () => {
    void persist()
  }, { deep: true })

  return {
    lastSavedAt,
    error,
    flush: persist,
    clear: async () => {
      try {
        await source.clear?.()
        lastSavedAt.value = null
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause : new Error(String(cause))
      }
    },
  }
}
