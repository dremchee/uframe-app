import type { EditorStorageAdapter } from '@/core/types/block-registry'
import type { PageDocument } from '@/core/types/page-document'
import { safeParsePageDocument } from '@/core/utils/serialization'

/**
 * Stores the document in `localStorage` under `key` as JSON. Validates on
 * load via the page-document schema; returns `null` on invalid / missing data.
 *
 * Safe to call in SSR — no-ops when `localStorage` is unavailable.
 */
export function createLocalStorageAdapter(key: string): EditorStorageAdapter {
  return {
    load() {
      if (typeof localStorage === 'undefined')
        return null

      const raw = localStorage.getItem(key)
      if (!raw)
        return null

      try {
        const parsed = JSON.parse(raw)
        const result = safeParsePageDocument(parsed)
        return result.success ? (result.data as PageDocument) : null
      }
      catch {
        return null
      }
    },
    save(document) {
      if (typeof localStorage === 'undefined')
        return

      try {
        localStorage.setItem(key, JSON.stringify(document))
      }
      catch {
        // Quota exceeded / SecurityError — surface via the autosave error ref.
        throw new Error(`Failed to write document to localStorage["${key}"]`)
      }
    },
    clear() {
      if (typeof localStorage !== 'undefined')
        localStorage.removeItem(key)
    },
  }
}

/**
 * In-memory adapter useful for tests, SSR, or wiring a custom backend through
 * the editor without persisting to a browser storage.
 */
export function createMemoryStorageAdapter(seed?: PageDocument): EditorStorageAdapter {
  let snapshot: PageDocument | null = seed ?? null
  return {
    load: () => snapshot,
    save: (document) => {
      snapshot = document
    },
    clear: () => {
      snapshot = null
    },
  }
}
