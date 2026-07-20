// Framework-agnostic host-side client for the iframe embed. No Vue, no editor
// code — just an <iframe> + the postMessage protocol. Shipped as `uframe/embed`.
import type { AssetPick, AssetRequest, EditorStyleTokens, EditorUiTheme, GlobalSettings, NormalizedSchema, PageDocument, PageViewport, ResolveContext, StyleViewport } from '@/core'
import type { EditorMessage, HostMessage, UframeEditorState, UframeLoadOptions, UframeMessages, UframeTheme, WithoutVersion } from '@/embed/protocol'
import { isEditorMessage, withProtocolVersion } from '@/embed/protocol'

export type { EditorStyleTokens, EditorUiTheme } from '@/core'
export type { UframeEditorState, UframeTheme } from '@/embed/protocol'

export interface CreateUframeEditorOptions {
  /** Where to mount: a container (an iframe is created inside) or an existing iframe. */
  target: HTMLElement
  /** URL of the built embed app (embed-dist/index.html). */
  src: string
  /** Initial document; sent on the editor's `ready` handshake. Single-page mode. */
  document?: PageDocument
  /**
   * Initial set of pages. When provided, the editor runs in multi-page mode and
   * renders a page switcher. Each page is a `PageDocument` (carries id + title).
   */
  pages?: PageDocument[]
  /** Which page is active on load (defaults to the first). */
  activePageId?: string
  /**
   * Shared context (CSS variables / breakpoints / classes / symbols / page
   * defaults) common to the whole page set; sent on the `ready` handshake.
   * `null`/omitted → single-document mode (globals live on each document).
   */
  globals?: GlobalSettings | null
  readonly?: boolean
  /** Show the editor's built-in toolbar. Defaults to `true`. */
  toolbarVisible?: boolean
  /** Initial public editor UI state; overrides matching legacy options. */
  state?: Partial<UframeEditorState>
  theme?: UframeTheme
  /** Editor UI locale, defaults to `en`. */
  locale?: string
  /** Host overrides for editor and plugin messages. */
  messages?: UframeMessages
  /** Semantic light/dark palettes for the editor interface. */
  uiTheme?: EditorUiTheme
  /** Prefix-free overrides, e.g. `{ accent: '#7c3aed' }`. */
  styleTokens?: EditorStyleTokens
  /** URLs of plugin dist modules to load into the editor on the `ready` handshake. */
  plugins?: string[]
  /** Collection schema for the binding picker; sent after load (also via `setSchema`). */
  schema?: NormalizedSchema
  /** Sample data to preview bound/repeated blocks; sent after load (also via `setDataContext`). */
  dataContext?: ResolveContext
  onReady?: () => void
  /** Called when the editor changes a public UI-state field internally. */
  onStateChange?: (state: UframeEditorState) => void
  /** Content edit of the active page. `document.id` identifies which page. */
  onChange?: (document: PageDocument) => void
  onSave?: (document: PageDocument) => void
  /** Structural change to the page set (add / delete / reorder / rename). */
  onPagesChange?: (pages: PageDocument[], activePageId: string) => void
  /** The user switched the active page inside the editor. */
  onActivePageChange?: (pageId: string) => void
  /** Edit to the shared context — persist it independently of the document(s). */
  onGlobalsChange?: (globals: GlobalSettings) => void
  /**
   * The editor asks to pick a media asset (image/file). Open the CMS's native
   * media library, then reply via `handle.setAsset(requestId, pick)` — or
   * `setAsset(requestId, null)` if the user cancels.
   */
  onRequestAsset?: (request: AssetRequest & { requestId: string }) => void
  onError?: (message: string) => void
}

export interface UframeEditorHandle {
  iframe: HTMLIFrameElement
  setDocument: (document: PageDocument) => void
  /** Replace the whole page set (multi-page mode). */
  setPages: (pages: PageDocument[], activePageId?: string) => void
  /** Switch the active page from the host. */
  setActivePage: (pageId: string) => void
  /** Push the shared context (or `null` for single-document mode). */
  setGlobals: (globals: GlobalSettings | null) => void
  setReadonly: (readonly: boolean) => void
  /** Update one or more public editor UI-state fields. */
  setState: (state: Partial<UframeEditorState>) => void
  /** Show or hide the editor's built-in toolbar. */
  setToolbarVisible: (visible: boolean) => void
  /** Change the canvas viewport without showing the editor toolbar. */
  setViewport: (viewport: PageViewport) => void
  /** Select a responsive breakpoint by its document-defined ID. */
  setEditBreakpoint: (breakpoint: StyleViewport) => void
  setTheme: (theme: UframeTheme) => void
  setLocale: (locale: string) => void
  setMessages: (messages: UframeMessages) => void
  setUiTheme: (theme: EditorUiTheme) => void
  setStyleTokens: (tokens: EditorStyleTokens) => void
  /** Open the Settings panel with the New breakpoint form. */
  openAddBreakpoint: () => void
  /** Dynamically load + register plugin dist modules by URL at runtime. */
  loadPlugins: (urls: string[]) => void
  /** Push the collection schema for the binding picker. */
  setSchema: (schema: NormalizedSchema) => void
  /** Push sample data used to preview bound / repeated blocks. */
  setDataContext: (context: ResolveContext) => void
  /** Reply to an `onRequestAsset` with the chosen asset (or null if cancelled). */
  setAsset: (requestId: string, asset: AssetPick | null) => void
  requestSave: () => void
  destroy: () => void
}

export function createUframeEditor(options: CreateUframeEditorOptions): UframeEditorHandle {
  const embedOrigin = new URL(options.src, location.href).origin

  // Tell the iframe our origin so it can validate + target replies.
  const url = new URL(options.src, location.href)
  url.searchParams.set('parentOrigin', location.origin)
  // The iframe renders before the postMessage handshake. Put the initial
  // chrome visibility in its URL so it does not briefly mount the default
  // toolbar before the host's `uframe:load` message arrives.
  const initialToolbarVisible = options.state?.toolbarVisible ?? options.toolbarVisible
  if (initialToolbarVisible === false)
    url.searchParams.set('toolbarVisible', 'false')

  const created = options.target.tagName !== 'IFRAME'
  const iframe = created ? globalThis.document.createElement('iframe') : (options.target as HTMLIFrameElement)
  if (created) {
    iframe.style.border = '0'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    options.target.appendChild(iframe)
  }

  let ready = false
  const pending: HostMessage[] = []

  function send(message: WithoutVersion<HostMessage>) {
    const full = withProtocolVersion(message) as HostMessage
    if (!ready) {
      pending.push(full)
      return
    }
    iframe.contentWindow?.postMessage(full, embedOrigin)
  }

  function flush() {
    for (const message of pending)
      iframe.contentWindow?.postMessage(message, embedOrigin)
    pending.length = 0
  }

  function onMessage(event: MessageEvent) {
    if (event.origin !== embedOrigin || event.source !== iframe.contentWindow)
      return
    if (!isEditorMessage(event.data))
      return
    const message = event.data as EditorMessage
    switch (message.type) {
      case 'uframe:ready': {
        ready = true
        const loadOptions: UframeLoadOptions = {
          readonly: options.readonly,
          toolbarVisible: options.toolbarVisible,
          theme: options.theme,
          locale: options.locale,
          messages: options.messages,
          uiTheme: options.uiTheme,
          styleTokens: options.styleTokens,
          plugins: options.plugins,
          state: options.state,
        }
        iframe.contentWindow?.postMessage(
          withProtocolVersion({
            type: 'uframe:load',
            document: options.document,
            pages: options.pages,
            activePageId: options.activePageId,
            globals: options.globals,
            options: loadOptions,
          }),
          embedOrigin,
        )
        flush()
        if (options.schema)
          send({ type: 'uframe:setSchema', schema: options.schema })
        if (options.dataContext)
          send({ type: 'uframe:setDataContext', context: options.dataContext })
        options.onReady?.()
        break
      }
      case 'uframe:change':
        options.onChange?.(message.document)
        break
      case 'uframe:stateChange':
        options.onStateChange?.(message.state)
        break
      case 'uframe:save':
        options.onSave?.(message.document)
        break
      case 'uframe:pagesChange':
        options.onPagesChange?.(message.pages, message.activePageId)
        break
      case 'uframe:activePageChange':
        options.onActivePageChange?.(message.pageId)
        break
      case 'uframe:globalsChange':
        options.onGlobalsChange?.(message.globals)
        break
      case 'uframe:requestAsset':
        options.onRequestAsset?.({ requestId: message.requestId, blockId: message.blockId, kind: message.kind })
        break
      case 'uframe:error':
        options.onError?.(message.message)
        break
    }
  }

  window.addEventListener('message', onMessage)
  iframe.src = url.toString()

  return {
    iframe,
    setDocument: document => send({ type: 'uframe:setDocument', document }),
    setPages: (pages, activePageId) => send({ type: 'uframe:setPages', pages, activePageId }),
    setActivePage: pageId => send({ type: 'uframe:setActivePage', pageId }),
    setGlobals: globals => send({ type: 'uframe:setGlobals', globals }),
    setReadonly: readonly => send({ type: 'uframe:setState', state: { readonly } }),
    setState: state => send({ type: 'uframe:setState', state }),
    setToolbarVisible: toolbarVisible => send({ type: 'uframe:setState', state: { toolbarVisible } }),
    setViewport: viewport => send({ type: 'uframe:setState', state: { viewport } }),
    setEditBreakpoint: viewport => send({ type: 'uframe:setState', state: { viewport } }),
    setTheme: theme => send({ type: 'uframe:setState', state: { theme } }),
    setLocale: locale => send({ type: 'uframe:setState', state: { locale } }),
    setMessages: messages => send({ type: 'uframe:setMessages', messages }),
    setUiTheme: theme => send({ type: 'uframe:setUiTheme', theme }),
    setStyleTokens: tokens => send({ type: 'uframe:setStyleTokens', tokens }),
    openAddBreakpoint: () => send({ type: 'uframe:openAddBreakpoint' }),
    loadPlugins: urls => send({ type: 'uframe:loadPlugins', urls }),
    setSchema: schema => send({ type: 'uframe:setSchema', schema }),
    setDataContext: context => send({ type: 'uframe:setDataContext', context }),
    setAsset: (requestId, asset) => send({ type: 'uframe:setAsset', requestId, asset }),
    requestSave: () => send({ type: 'uframe:requestSave' }),
    destroy: () => {
      window.removeEventListener('message', onMessage)
      if (created)
        iframe.remove()
    },
  }
}
