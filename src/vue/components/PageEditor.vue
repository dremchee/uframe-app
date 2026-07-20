<script setup lang="ts">
import type { Component } from 'vue'
import type { AssetPick, AssetRequest, BlockRegistry, EditorFeatureFlags, EditorStorageAdapter, EditorStyleTokens, EditorUiTheme, GlobalSettings, NormalizedSchema, PageDocument, ResolveContext, UframePlugin } from '@/core'
import type { UframeEditorState } from '@/embed/protocol'
import type { EditorTheme } from '@/vue/composables/editor/useEditorStorage'
import type { CanvasChannel, PageEditorContext } from '@/vue/context/editor-context'
import type { LocaleMessages } from '@/vue/i18n'
import { computed, onMounted, provide, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { defaultBlockDefinitions } from '@/blocks'
import { createBlockRegistry, createLocalStorageAdapter, createPageDocument, resolveEditorStyleTokens } from '@/core'
import EditorShell from '@/vue/components/EditorShell.vue'
import { loadAutosavedDocument, useAutosave } from '@/vue/composables/editor/useAutosave'
import { useEditorHotkeys } from '@/vue/composables/editor/useEditorHotkeys'
import { useEditorPluginChrome } from '@/vue/composables/editor/useEditorPluginChrome'
import { usePageEditor } from '@/vue/composables/editor/usePageEditor'
import { usePageEditorHostBindings } from '@/vue/composables/editor/usePageEditorHostBindings'
import { useEditorRootStyleTokens } from '@/vue/composables/ui/useEditorRootStyleTokens'
import { useEditorThemeClass } from '@/vue/composables/ui/useEditorThemeClass'
import { pageEditorContextKey } from '@/vue/context/editor-context'
import { provideUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  initialDocument?: PageDocument
  blocks?: BlockRegistry
  readonly?: boolean
  /** Show the editor's built-in toolbar. Defaults to `true`. */
  toolbarVisible?: boolean
  /** Either a localStorage key (shorthand) or a full EditorStorageAdapter. */
  autosaveKey?: string
  storage?: EditorStorageAdapter
  /**
   * localStorage key for the editor's UI preferences (sidebar pin / mode /
   * width). Defaults to a shared key; pass a per-instance key when two
   * editors share the same page and need isolated preferences.
   */
  prefsKey?: string
  features?: EditorFeatureFlags
  /**
   * Plugins augment the editor: their `blocks` merge onto the registry
   * (last-wins on a type clash, plugins over the base), `styleTokens` apply to
   * the editor-chrome root, and `toolbarSlots` mount into the toolbar clusters.
   */
  plugins?: UframePlugin<Component>[]
  /** CMS collection schema for the binding picker (dynamic content). */
  schema?: NormalizedSchema
  /** Sample data to preview bound / repeated blocks. */
  dataContext?: ResolveContext
  /** Host-driven media picker; resolves to the chosen asset or null. */
  requestAsset?: (req: AssetRequest) => Promise<AssetPick | null>
  /**
   * Treat documents as untrusted — embed blocks render inside a sandboxed
   * iframe (isolated from the editor origin) instead of inlining their HTML.
   * Enable when documents may carry content authored by someone other than the
   * page owner (e.g. a multi-tenant CMS). Defaults to `false`.
   */
  untrustedEmbeds?: boolean
  /** Editor-UI locale; defaults to `en`. Combine with `messages` to translate. */
  locale?: string
  /**
   * Per-locale overrides for the editor-chrome strings, merged over the bundled
   * English catalog (override only the keys you need). Shape mirrors `en`.
   */
  messages?: Partial<Record<string, LocaleMessages>>
  /** Light/dark semantic palettes for the editor interface. */
  uiTheme?: EditorUiTheme
  /** Prefix-free overrides for the active palette. Plugin tokens win. */
  styleTokens?: EditorStyleTokens
}>(), {
  blocks: () => createBlockRegistry(defaultBlockDefinitions),
  features: () => ({
    autosave: true,
    history: true,
    hotkeys: true,
    preview: true,
  }),
})

const emit = defineEmits<{
  save: [document: PageDocument]
  error: [errors: string[]]
  draftRestored: [document: PageDocument]
  /** Public UI state for embedding hosts. */
  stateChange: [state: Pick<UframeEditorState, 'viewport' | 'preview' | 'theme'>]
}>()

const model = defineModel<PageDocument>()
const editorShell = useTemplateRef<InstanceType<typeof EditorShell>>('editorShell')
// Multi-page models. Providing `pages` switches the editor into multi-page mode
// (a Pages panel appears in the left rail). Each page is a PageDocument.
const pagesModel = defineModel<PageDocument[]>('pages')
const activePageIdModel = defineModel<string>('activePageId')
// Shared context settings (CSS variables / breakpoints / classes / symbols /
// defaults) global across the page set. Providing it opts the editor into a
// shared context; omitting keeps single-document behaviour. See GlobalSettings.
const globalsModel = defineModel<GlobalSettings | null>('globals')

// Resolved feature flags (defaults applied → definite booleans), provided on
// the context as a single object so any chrome component can gate on it. Add a
// flag to EditorFeatureFlags and it flows through here.
const features: Required<EditorFeatureFlags> = {
  autosave: props.features.autosave !== false,
  history: props.features.history !== false,
  hotkeys: props.features.hotkeys !== false,
  preview: props.features.preview !== false,
}
const restoredFromDraft = shallowRef(false)

const adapter = computed<EditorStorageAdapter | undefined>(() => {
  if (props.storage)
    return props.storage
  if (props.autosaveKey)
    return createLocalStorageAdapter(props.autosaveKey)
  return undefined
})

function resolveInitialDocument(): PageDocument {
  if (features.autosave && adapter.value) {
    const restored = loadAutosavedDocument(adapter.value)
    if (restored) {
      restoredFromDraft.value = true
      return restored
    }
  }
  return model.value ?? props.initialDocument ?? createPageDocument()
}

// Plugins are construction-time: merge their blocks onto the registry once,
// flatten their style tokens for the chrome root, and collect their toolbar
// components for the context-provided slots.
// Canvas geometry + state, written by CanvasViewport and read by plugin
// overlays / canvas layers (e.g. the AI window and its "generating" ring).
const canvas: CanvasChannel = {
  paneEl: shallowRef(null),
  frameEl: shallowRef(null),
  selectionRect: ref(null),
  selectionRadius: ref(null),
  busy: ref(false),
}

const editor = usePageEditor({
  document: resolveInitialDocument(),
  globals: globalsModel.value ?? undefined,
  blocks: props.blocks,
  plugins: props.plugins,
  readonly: props.readonly,
  storageKey: props.prefsKey,
})

// This must target <html>, not .uf-editor, so portaled reka-ui overlays follow
// the same mode even when the editor is embedded in another application.
const { isDark } = useEditorThemeClass(editor.storage)
const { pluginMessages, pluginSlots, styleTokens: pluginStyleTokens } = useEditorPluginChrome(editor)
const styleTokens = computed(() => resolveEditorStyleTokens({
  ...props.uiTheme?.[isDark.value ? 'dark' : 'light'],
  ...props.styleTokens,
  ...pluginStyleTokens.value,
}))
useEditorRootStyleTokens(styleTokens)

const autosave = features.autosave && adapter.value
  ? useAutosave(editor.document, adapter.value, {
      // While editing a symbol the document holds only the symbol's root
      // (not the page); don't persist that transient view or a reload would
      // strand the user in edit mode with no way back.
      paused: () => editor.editingSymbolId.value != null,
    })
  : null

const lastSavedAt = computed(() => autosave?.lastSavedAt.value ?? null)
const autosaveError = computed(() => autosave?.error.value ?? null)

// Dynamic-content context (host-supplied). Reactive so a later setSchema /
// setDataContext push updates the binding picker + preview live.
const schema = computed<NormalizedSchema>(() => props.schema ?? { collections: [] })
const dataContext = computed<ResolveContext | undefined>(() => props.dataContext)

function save() {
  emit('save', editor.document.value)
}

const context: PageEditorContext = {
  editor,
  lastSavedAt,
  autosaveError,
  features,
  schema,
  dataContext,
  requestAsset: props.requestAsset,
  save,
  pluginSlots,
  canvas,
  untrustedEmbeds: props.untrustedEmbeds === true,
  emit: {
    save: (document: PageDocument) => emit('save', document),
  },
}

provide(pageEditorContextKey, context)
provideUframeI18n(() => props.locale, () => props.messages, () => pluginMessages.value)

// Runtime plugin registration for hosts that drive the editor from outside the
// component tree (e.g. the iframe embed loading plugin dists by URL).
function setTheme(theme: EditorTheme) {
  editor.storage.value.theme = theme
}
function setPreview(preview: boolean) {
  editor.isPreviewMode.value = preview
}
function openAddBreakpoint() {
  editorShell.value?.openAddBreakpoint()
}
function getState(): Pick<UframeEditorState, 'viewport' | 'preview' | 'theme'> {
  return {
    viewport: editor.editBreakpoint.value,
    preview: editor.isPreviewMode.value,
    theme: editor.storage.value.theme,
  }
}
defineExpose({
  registerPlugins: editor.registerPlugins,
  loadPlugins: editor.loadPlugins,
  setTheme,
  setViewport: editor.setViewport,
  setEditBreakpoint: editor.setEditBreakpoint,
  setPreview,
  openAddBreakpoint,
  getState,
})

watch(
  [editor.editBreakpoint, editor.isPreviewMode, () => editor.storage.value.theme],
  () => emit('stateChange', getState()),
)

if (restoredFromDraft.value)
  emit('draftRestored', editor.document.value)

// Async restore path: if the adapter returns a Promise, await it after mount
// and load the document if one is returned (and we didn't already restore
// synchronously).
onMounted(async () => {
  if (restoredFromDraft.value || !features.autosave || !adapter.value)
    return

  try {
    const result = adapter.value.load()
    if (!(result instanceof Promise))
      return

    const doc = await result
    if (doc) {
      editor.load(doc)
      restoredFromDraft.value = true
      emit('draftRestored', doc)
    }
  }
  catch {
    // Surface via autosave.error if needed; for now, ignore.
  }
})

if (features.hotkeys)
  useEditorHotkeys(editor)

usePageEditorHostBindings({
  editor,
  documentModel: model,
  pagesModel,
  activePageIdModel,
  globalsModel,
  onError: errors => emit('error', errors),
})
</script>

<template>
  <EditorShell ref="editorShell" :style-tokens="styleTokens" :toolbar-visible="toolbarVisible" />
</template>
