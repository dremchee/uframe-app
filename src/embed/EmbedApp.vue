<script setup lang="ts">
import type { AssetPick, AssetRequest, EditorStyleTokens, EditorUiTheme, GlobalSettings, NormalizedSchema, PageDocument, PageViewport, ResolveContext, StyleViewport } from '@/core'
import type { EditorMessage, HostMessage, UframeEditorState, UframeTheme, WithoutVersion } from '@/embed/protocol'
import type { LocaleMessages } from '@/vue/i18n'
import { useThrottleFn } from '@vueuse/core'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { createPageDocument } from '@/core'
import { isHostMessage, withProtocolVersion } from '@/embed/protocol'
import { PageEditor } from '@/vue'

// The host origin is passed on the iframe URL (?parentOrigin=…) so we can both
// validate incoming host messages and target our replies precisely. When it's
// absent we fail closed: never fall back to '*', which would accept messages
// from — and broadcast document content to — any origin. The bundled embed
// client always sets it; a hand-rolled host must too.
const parentOrigin = new URLSearchParams(location.search).get('parentOrigin')
const initialToolbarVisible = new URLSearchParams(location.search).get('toolbarVisible') !== 'false'

// Single-document mode (host never supplies `pages`).
const document = shallowRef<PageDocument>(createPageDocument())
// Multi-page mode: a non-empty `pages` puts the editor's built-in Pages panel
// (in the left rail) on screen. The page UI now lives in the editor core.
const pages = shallowRef<PageDocument[]>([])
const activePageId = ref<string>()
const readonly = ref(false)
const toolbarVisible = ref(initialToolbarVisible)
const locale = ref<string>()
const messages = shallowRef<Partial<Record<string, LocaleMessages>>>()
const uiTheme = shallowRef<EditorUiTheme>()
const styleTokens = shallowRef<EditorStyleTokens>({})
// Shared context (CSS variables / breakpoints / classes / symbols / page
// defaults) common to the whole page set; null = single-document mode.
const globals = shallowRef<GlobalSettings | null>(null)
// Dynamic content: host-supplied schema (binding picker) + sample data (preview).
const schema = shallowRef<NormalizedSchema>()
const dataContext = shallowRef<ResolveContext>()
const editorRef = ref<{
  loadPlugins: (urls: string[]) => Promise<void>
  setTheme: (theme: UframeTheme) => void
  setViewport: (viewport: PageViewport) => void
  setEditBreakpoint: (breakpoint: StyleViewport) => void
  openAddBreakpoint: () => void
  setPreview: (preview: boolean) => void
  getState: () => Pick<UframeEditorState, 'viewport' | 'preview' | 'theme'>
} | null>(null)

function post(message: WithoutVersion<EditorMessage>) {
  // No verified host origin → don't emit (content must not reach an unknown origin).
  if (!parentOrigin)
    return
  parent.postMessage(withProtocolVersion(message), parentOrigin)
}

function currentState(): UframeEditorState {
  const editorState = editorRef.value?.getState()
  return {
    viewport: editorState?.viewport ?? 'base',
    preview: editorState?.preview ?? false,
    theme: editorState?.theme ?? 'light',
    toolbarVisible: toolbarVisible.value,
    readonly: readonly.value,
    locale: locale.value,
    activePageId: activePageId.value,
  }
}

function postState() {
  post({ type: 'uframe:stateChange', state: currentState() })
}

function applyState(state: Partial<UframeEditorState>) {
  if (state.readonly !== undefined)
    readonly.value = state.readonly
  if (state.toolbarVisible !== undefined)
    toolbarVisible.value = state.toolbarVisible
  if (state.locale !== undefined)
    locale.value = state.locale
  if (state.activePageId !== undefined)
    activePageId.value = state.activePageId
  if (state.viewport !== undefined)
    editorRef.value?.setEditBreakpoint(state.viewport)
  if (state.preview !== undefined)
    editorRef.value?.setPreview(state.preview)
  if (state.theme !== undefined)
    editorRef.value?.setTheme(state.theme)
}

// Active-document content edits (throttled). `document` mirrors the editor's
// active page in both modes, so this covers single- and multi-page alike.
let ignoreHostDocumentChange = false
const postChange = useThrottleFn(() => {
  post({ type: 'uframe:change', document: document.value })
}, 150, true)
watch(document, () => {
  if (ignoreHostDocumentChange) {
    ignoreHostDocumentChange = false
    return
  }
  postChange()
})

// Structural page-set changes (add / delete / rename / reorder / switch).
watch(pages, () => {
  if (pages.value.length)
    post({ type: 'uframe:pagesChange', pages: pages.value, activePageId: activePageId.value ?? pages.value[0]!.id })
})
watch(activePageId, (id) => {
  if (id && pages.value.length)
    post({ type: 'uframe:activePageChange', pageId: id })
})

// Shared-context edits (variables / breakpoints / classes / symbols / defaults),
// throttled like content edits. The host persists globals independently.
let ignoreHostGlobalsChange = false
const postGlobals = useThrottleFn(() => {
  if (globals.value)
    post({ type: 'uframe:globalsChange', globals: globals.value })
}, 150, true)
watch(globals, () => {
  if (ignoreHostGlobalsChange) {
    ignoreHostGlobalsChange = false
    return
  }
  postGlobals()
})
watch([readonly, toolbarVisible, locale, activePageId], postState)

function onEditorStateChange() {
  postState()
}

function onSave() {
  post({ type: 'uframe:save', document: document.value })
}

// Media picker bridge: the editor's `requestAsset` becomes a round-trip —
// post `uframe:requestAsset`, then resolve the Promise when the host replies
// with a `uframe:setAsset` carrying the same requestId.
const pendingAssetPicks = new Map<string, (pick: AssetPick | null) => void>()
let assetReqSeq = 0

function requestAsset(request: AssetRequest): Promise<AssetPick | null> {
  const requestId = `a${++assetReqSeq}`
  return new Promise((resolve) => {
    pendingAssetPicks.set(requestId, resolve)
    post({ type: 'uframe:requestAsset', requestId, blockId: request.blockId, kind: request.kind })
  })
}

function handle(message: HostMessage) {
  switch (message.type) {
    case 'uframe:load':
      if (message.pages?.length) {
        pages.value = message.pages
        activePageId.value = message.activePageId ?? message.pages[0]!.id
      }
      else if (message.document) {
        ignoreHostDocumentChange = true
        document.value = message.document
      }
      if (message.globals !== undefined) {
        ignoreHostGlobalsChange = true
        globals.value = message.globals
      }
      readonly.value = message.options?.readonly ?? false
      toolbarVisible.value = message.options?.toolbarVisible !== false
      locale.value = message.options?.locale
      messages.value = message.options?.messages as Partial<Record<string, LocaleMessages>> | undefined
      uiTheme.value = message.options?.uiTheme
      styleTokens.value = message.options?.styleTokens ?? {}
      if (message.options?.theme)
        editorRef.value?.setTheme(message.options.theme)
      if (message.options?.plugins?.length)
        void editorRef.value?.loadPlugins(message.options.plugins)
      if (message.options?.state)
        applyState(message.options.state)
      void nextTick(postState)
      break
    case 'uframe:loadPlugins':
      void editorRef.value?.loadPlugins(message.urls)
      break
    case 'uframe:setDocument':
      ignoreHostDocumentChange = true
      document.value = message.document
      break
    case 'uframe:setPages':
      pages.value = message.pages
      activePageId.value = message.activePageId ?? message.pages[0]?.id
      break
    case 'uframe:setActivePage':
      activePageId.value = message.pageId
      break
    case 'uframe:setGlobals':
      ignoreHostGlobalsChange = true
      globals.value = message.globals
      break
    case 'uframe:setReadonly':
      readonly.value = message.readonly
      break
    case 'uframe:setToolbarVisible':
      toolbarVisible.value = message.visible
      break
    case 'uframe:setViewport':
      editorRef.value?.setViewport(message.viewport)
      break
    case 'uframe:setEditBreakpoint':
      editorRef.value?.setEditBreakpoint(message.breakpoint)
      break
    case 'uframe:setState':
      applyState(message.state)
      void nextTick(postState)
      break
    case 'uframe:setTheme':
      editorRef.value?.setTheme(message.theme)
      break
    case 'uframe:setLocale':
      locale.value = message.locale
      break
    case 'uframe:setMessages':
      messages.value = message.messages as Partial<Record<string, LocaleMessages>>
      break
    case 'uframe:setUiTheme':
      uiTheme.value = message.theme
      break
    case 'uframe:setStyleTokens':
      styleTokens.value = message.tokens
      break
    case 'uframe:openAddBreakpoint':
      editorRef.value?.openAddBreakpoint()
      break
    case 'uframe:requestSave':
      onSave()
      break
    case 'uframe:setSchema':
      schema.value = message.schema
      break
    case 'uframe:setDataContext':
      dataContext.value = message.context
      break
    case 'uframe:setAsset': {
      const resolve = pendingAssetPicks.get(message.requestId)
      if (resolve) {
        pendingAssetPicks.delete(message.requestId)
        resolve(message.asset)
      }
      break
    }
  }
}

function onMessage(event: MessageEvent) {
  // Fail closed: without a configured host origin we can't verify the sender.
  if (!parentOrigin || event.origin !== parentOrigin)
    return
  if (event.source !== parent)
    return
  if (isHostMessage(event.data))
    handle(event.data)
}

onMounted(() => {
  if (!parentOrigin) {
    console.warn('[uframe embed] no ?parentOrigin — host messaging is disabled (fail closed). Pass parentOrigin to enable it.')
    return
  }
  window.addEventListener('message', onMessage)
  // Handshake: announce readiness; the host replies with `uframe:load`.
  post({ type: 'uframe:ready' })
})

onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <PageEditor
    ref="editorRef"
    v-model="document"
    v-model:pages="pages"
    v-model:active-page-id="activePageId"
    v-model:globals="globals"
    :readonly="readonly"
    :toolbar-visible="toolbarVisible"
    :locale="locale"
    :messages="messages"
    :ui-theme="uiTheme"
    :style-tokens="styleTokens"
    :schema="schema"
    :data-context="dataContext"
    :request-asset="requestAsset"
    :features="{ autosave: false }"
    @save="onSave"
    @state-change="onEditorStateChange"
  />
</template>
