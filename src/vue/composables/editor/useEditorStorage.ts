import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'

// Which panel the left sidebar shows. Defined here (a leaf module) rather than
// in the rail component so composables can reference it without importing a .vue.
export type SidebarMode = 'pages' | 'add' | 'layers' | 'components' | 'variables' | 'classes' | 'history' | 'settings'
// `system` follows the OS `prefers-color-scheme` (and tracks live changes).
export type EditorTheme = 'light' | 'dark' | 'system'

// Persisted editor UI preferences. Everything the editor wants to remember
// between sessions lives here — add a field + default and read it through
// the editor's `.storage` ref. (The page document itself is persisted
// separately, under a consumer-provided autosave key.)
export interface EditorStorage {
  sidebarPinned: boolean
  // Built-in mode or a plugin panel id. `(string & {})` keeps the literal hints
  // for the built-ins while still allowing arbitrary plugin ids.
  sidebarMode: SidebarMode | (string & {})
  /** Width (px) of the sidebar panel, shared by the docked and floating states. */
  sidebarWidth: number
  /** Editor chrome theme. The rendered page in the canvas stays light. */
  theme: EditorTheme
  /**
   * Open/closed state of the style panel's sections, keyed by stable section
   * id (see STYLE_SECTIONS) — the layout survives element switches (which
   * remount the panel) and reloads. A missing key means "use the section's
   * default".
   */
  styleSections: Record<string, boolean>
  /**
   * Per-plugin preference bag, namespaced by plugin name — so official and
   * third-party plugins can persist their own settings (API keys, caches, …)
   * without core knowing their shape. A plugin owns its `plugins[name]` slot;
   * see `useEditorPluginStorage`. Like the rest of this store it's per-browser
   * and NEVER serialized into the document/globals.
   */
  plugins: Record<string, Record<string, unknown>>
}

export const DEFAULT_EDITOR_STORAGE_KEY = 'uf-editor'

const DEFAULTS: EditorStorage = {
  sidebarPinned: false,
  sidebarMode: 'layers',
  sidebarWidth: 264,
  theme: 'system',
  styleSections: {},
  plugins: {},
}

export type EditorStorageRef = RemovableRef<EditorStorage>

/**
 * Read/write a single plugin's namespace in the editor's local prefs
 * (`storage.plugins[name]`), merged over `defaults`. Returns a helper to build
 * writable computeds bound to one key each — the pattern the AI plugin uses for
 * its API key / model. Keeps plugin-specific keys out of the core `EditorStorage`.
 */
export function useEditorPluginStorage<T extends object>(
  storage: RemovableRef<EditorStorage>,
  name: string,
  defaults: T,
) {
  function read<K extends keyof T>(key: K): T[K] {
    const ns = storage.value.plugins?.[name] as Partial<T> | undefined
    return (ns?.[key] ?? defaults[key]) as T[K]
  }
  function write<K extends keyof T>(key: K, value: T[K]): void {
    const plugins = storage.value.plugins ?? {}
    const ns = (plugins[name] ?? {}) as Record<string, unknown>
    storage.value.plugins = { ...plugins, [name]: { ...ns, [key as string]: value } }
  }
  return { read, write }
}

// Build a fresh, per-editor-instance preference store. Two PageEditor
// instances on the same page can pass different keys and stay isolated; the
// default key matches the historical behaviour (single shared instance).
export function createEditorStorage(key: string = DEFAULT_EDITOR_STORAGE_KEY): EditorStorageRef {
  return useLocalStorage<EditorStorage>(key, DEFAULTS, { mergeDefaults: true })
}
