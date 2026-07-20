import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { useEditorPluginStorage } from '@/vue/composables/editor/useEditorStorage'

/**
 * The AI plugin's slice of the editor's per-browser prefs. Persisted under
 * `storage.plugins.ai` — core never sees these keys. A per-browser secret
 * (`apiKey`), never written into the document / globals.
 */
export interface AiStorage {
  /** Provider API key (OpenAI-compatible). */
  apiKey: string
  /** Provider base URL. Empty → OpenAI default. */
  apiBaseUrl: string
  /** Selected chat model id. */
  model: string
  /** Cached model lists keyed by normalized base URL (survives reload / CORS fail). */
  modelsCache: Record<string, string[]>
  /** Active role/style preset id (see ./presets). Empty/`auto` = neutral. */
  preset: string
}

const AI_DEFAULTS: AiStorage = {
  apiKey: '',
  apiBaseUrl: '',
  // No default model — the user picks one from the fetched list.
  model: '',
  modelsCache: {},
  preset: 'auto',
}

/** Writable computeds bound to the AI plugin's slot in the editor's local prefs. */
export function useAiStorage(editor: PageEditorInstance) {
  const { read, write } = useEditorPluginStorage(editor.storage, 'ai', AI_DEFAULTS)
  return {
    apiKey: computed({ get: () => read('apiKey'), set: v => write('apiKey', v) }),
    apiBaseUrl: computed({ get: () => read('apiBaseUrl'), set: v => write('apiBaseUrl', v) }),
    model: computed({ get: () => read('model'), set: v => write('model', v) }),
    modelsCache: computed({ get: () => read('modelsCache'), set: v => write('modelsCache', v) }),
    preset: computed({ get: () => read('preset'), set: v => write('preset', v) }),
  }
}
