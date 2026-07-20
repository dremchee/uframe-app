import type { ChatTurn } from './generateBlocks'
import type { ScopeKind } from './presets'
import { computed, ref } from 'vue'
import { findBlock } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { generateBlocks } from './generateBlocks'
import { normalizeOpenAiBaseUrl } from './listModels'
import { AI_SUGGESTIONS, presetInstruction } from './presets'
import { useAiStorage } from './storage'
import { blockToSpec } from './template-spec'

export interface AiChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** Assistant message that reports a failure (rendered as an error). */
  error?: boolean
}

// Singleton state so the chat survives the floating window mounting/unmounting
// and the toolbar button can toggle it from outside the window.
const open = ref(false)
const messages = ref<AiChatMessage[]>([])
// Exported so the canvas can draw the "thinking" indicator over the target block.
export const loading = ref(false)
let uid = 0

export function toggleAiChat() {
  open.value = !open.value
}

export function useAiChat() {
  const { editor } = useEditorContext()
  const { t } = useUframeI18n()

  function localizedError(error: unknown): string {
    const message = error instanceof Error ? error.message : ''
    const known: Record<string, string> = {
      'No API key — set one in Settings': 'ai.noApiKey',
      'No model selected — pick one in Settings': 'ai.noModel',
      'Empty response from the model': 'ai.emptyResponse',
      'Response did not match the expected block shape': 'ai.invalidShape',
      'No usable blocks in the response': 'ai.noBlocks',
    }
    return known[message] ? t(known[message]!) : message || t('ai.generationFailed')
  }

  function localizedWarning(warning: string): string {
    let match = /^Unknown block type "(.+)" — skipped$/.exec(warning)
    if (match)
      return t('ai.warningUnknownBlock', { type: match[1]! })
    match = /^Invalid props for "(.+)" — used defaults$/.exec(warning)
    if (match)
      return t('ai.warningInvalidProps', { type: match[1]! })
    match = /^Some styles on "(.+)" were invalid and dropped$/.exec(warning)
    if (match)
      return t('ai.warningInvalidStyles', { type: match[1]! })
    match = /^"(.+)" can't contain children — dropped (\d+)$/.exec(warning)
    if (match)
      return t('ai.warningChildren', { type: match[1]!, count: match[2]! })
    return warning
  }
  const ai = useAiStorage(editor)

  // The scope to edit, derived from the canvas selection: nothing/root selected
  // → the whole page; a container → its children; any other block → itself.
  const scope = computed(() => {
    const id = editor.selectedBlockId.value
    const block = id ? findBlock(editor.document.value.blocks, id) : null
    if (!id || !block)
      return { id: null as string | null, label: t('ai.scopePage'), blocks: editor.document.value.blocks, kind: 'page' as ScopeKind }
    const def = editor.registry.value[block.type]
    const translatedName = def?.labelKey ? t(def.labelKey) : undefined
    const name = translatedName && translatedName !== def?.labelKey ? translatedName : def?.label ?? block.type
    const container = !!def?.acceptsChildren
    return {
      id: id as string | null,
      label: t('ai.scopeBlock', { name }),
      blocks: container ? (block.children ?? []) : [block],
      kind: (container ? 'container' : 'block') as ScopeKind,
      blockType: block.type,
    }
  })

  const suggestions = computed(() => AI_SUGGESTIONS[scope.value.kind])

  const ready = computed(() => !!ai.apiKey.value && !!ai.model.value)

  // Selected model + the cached model list for the active base URL — so the
  // composer can show a model picker without refetching (Settings owns fetching).
  const model = ai.model
  const models = computed(() => {
    const base = normalizeOpenAiBaseUrl(ai.apiBaseUrl.value)
    return ai.modelsCache.value?.[base] ?? []
  })

  // Active role/style preset — appended to the system prompt as style guidance.
  const preset = computed({
    get: () => ai.preset.value || 'auto',
    set: (v) => { ai.preset.value = v },
  })

  async function send(rawPrompt: string) {
    const prompt = rawPrompt.trim()
    if (!prompt || loading.value)
      return

    const sc = scope.value
    // History is the prior turns (before this prompt), errors excluded.
    const history: ChatTurn[] = messages.value
      .filter(m => !m.error)
      .map(m => ({ role: m.role, content: m.text }))

    messages.value.push({ id: ++uid, role: 'user', text: prompt })
    loading.value = true
    try {
      const result = await generateBlocks({
        apiKey: ai.apiKey.value,
        baseUrl: ai.apiBaseUrl.value,
        model: ai.model.value,
        registry: editor.registry.value,
        scopeLabel: sc.label,
        scope: {
          kind: sc.kind,
          blockType: sc.kind === 'block' ? sc.blockType : undefined,
        },
        scopeJson: JSON.stringify(sc.blocks.map(blockToSpec), null, 2),
        history,
        prompt,
        guidance: presetInstruction(preset.value),
      })
      editor.applyAiBlocks(sc.id, result.blocks, sc.id ? t('ai.historyEdit', { scope: sc.label }) : t('ai.historyGenerate'))
      const parts = [result.note || t('ai.updated', { scope: sc.label })]
      if (result.warnings.length)
        parts.push(`⚠ ${result.warnings.map(localizedWarning).join('; ')}`)
      messages.value.push({ id: ++uid, role: 'assistant', text: parts.join('\n') })
    }
    catch (err) {
      messages.value.push({
        id: ++uid,
        role: 'assistant',
        text: localizedError(err),
        error: true,
      })
    }
    finally {
      loading.value = false
    }
  }

  function clear() {
    messages.value = []
  }

  return { open, messages, loading, scope, suggestions, ready, model, models, preset, send, clear }
}
