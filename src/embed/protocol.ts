// Message protocol for the iframe embed. Both the in-iframe editor app
// (EmbedApp.vue) and the framework-agnostic host client (client.ts) import
// these types so the two sides stay in sync. PageDocument is plain JSON, so it
// survives `postMessage`'s structured clone.
import type { AssetPick, AssetRequest, EditorStyleTokens, EditorUiTheme, GlobalSettings, NormalizedSchema, PageDocument, PageViewport, ResolveContext, StyleViewport } from '@/core'

/** Bump when the message shape changes; both sides carry it as `v`. */
export const UFRAME_PROTOCOL_VERSION = 13

export type UframeTheme = 'light' | 'dark' | 'system'

/** Public UI state that an embedding host may control and observe. */
export interface UframeEditorState {
  viewport: StyleViewport
  preview: boolean
  toolbarVisible: boolean
  readonly: boolean
  theme: UframeTheme
  locale?: string
  activePageId?: string
}

/** Serializable locale payload shared by the framework-agnostic embed client. */
export type UframeMessages = Partial<Record<string, Record<string, unknown>>>

/**
 * Distributive Omit — preserves each union variant's own keys (plain `Omit`
 *  over a discriminated union collapses to the shared keys only).
 */
export type WithoutVersion<T> = T extends unknown ? Omit<T, 'v'> : never

/** Adds the current protocol version to an outbound host or editor message. */
export function withProtocolVersion<T extends { type: string }>(message: T): T & { v: number } {
  return { ...message, v: UFRAME_PROTOCOL_VERSION }
}

export interface UframeLoadOptions {
  readonly?: boolean
  /** Show the editor's built-in toolbar. Defaults to `true`. */
  toolbarVisible?: boolean
  theme?: UframeTheme
  /** Editor UI locale, defaults to `en`. */
  locale?: string
  /** Host overrides for editor and plugin messages. */
  messages?: UframeMessages
  /** Semantic light/dark palettes for the editor interface. */
  uiTheme?: EditorUiTheme
  /** Prefix-free overrides, e.g. `{ accent: '#7c3aed' }`. */
  styleTokens?: EditorStyleTokens
  /** URLs of plugin dist modules to dynamically import + register at load. */
  plugins?: string[]
  /** Initial public UI state. Explicit values override legacy options above. */
  state?: Partial<UframeEditorState>
}

/**
 * Multi-page mode: a "page" is just a `PageDocument` (it already carries its own
 * `id` and `title`). When the host supplies `pages`, the editor renders a page
 * switcher and edits operate on the active page; otherwise it runs in the
 * original single-document mode.
 */

/** Host → editor (iframe). */
export type HostMessage
  = | { type: 'uframe:load', v: number, document?: PageDocument, pages?: PageDocument[], activePageId?: string, globals?: GlobalSettings | null, options?: UframeLoadOptions }
    | { type: 'uframe:setDocument', v: number, document: PageDocument }
    | { type: 'uframe:setPages', v: number, pages: PageDocument[], activePageId?: string }
    | { type: 'uframe:setActivePage', v: number, pageId: string }
    // Shared context (CSS variables / breakpoints / classes / symbols / page
    // defaults) common to the whole page set. `null` → single-document mode.
    | { type: 'uframe:setGlobals', v: number, globals: GlobalSettings | null }
    | { type: 'uframe:setReadonly', v: number, readonly: boolean }
    | { type: 'uframe:setToolbarVisible', v: number, visible: boolean }
    /** Change the canvas viewport from the embedding host. */
    | { type: 'uframe:setViewport', v: number, viewport: PageViewport }
    /** Select the responsive style layer by its breakpoint ID. */
    | { type: 'uframe:setEditBreakpoint', v: number, breakpoint: StyleViewport }
    /** Update one or more public editor-state fields. */
    | { type: 'uframe:setState', v: number, state: Partial<UframeEditorState> }
    | { type: 'uframe:setTheme', v: number, theme: UframeTheme }
    | { type: 'uframe:setLocale', v: number, locale: string }
    | { type: 'uframe:setMessages', v: number, messages: UframeMessages }
    | { type: 'uframe:setUiTheme', v: number, theme: EditorUiTheme }
    | { type: 'uframe:setStyleTokens', v: number, tokens: EditorStyleTokens }
    /** Open the Settings panel with its New breakpoint form. */
    | { type: 'uframe:openAddBreakpoint', v: number }
    | { type: 'uframe:loadPlugins', v: number, urls: string[] }
    | { type: 'uframe:requestSave', v: number }
    // Dynamic content: the host (CMS adapter) supplies the collection schema for
    // the binding picker, and sample data to preview bound/repeated blocks.
    // Consumed by the editor's binding UI. See dynamic-content-plan.md §2/§3.
    | { type: 'uframe:setSchema', v: number, schema: NormalizedSchema }
    | { type: 'uframe:setDataContext', v: number, context: ResolveContext }
    // Media: the host's answer to a `requestAsset` — the chosen asset (or null
    // if cancelled), correlated by `requestId`. See cms-extension-plan §6.
    | { type: 'uframe:setAsset', v: number, requestId: string, asset: AssetPick | null }

/** Editor (iframe) → host. */
export type EditorMessage
  = | { type: 'uframe:ready', v: number }
    /** Public UI state changed inside the editor. */
    | { type: 'uframe:stateChange', v: number, state: UframeEditorState }
    // Content edit of the active document (throttled). `document.id` identifies the page.
    | { type: 'uframe:change', v: number, document: PageDocument }
    | { type: 'uframe:save', v: number, document: PageDocument }
    // Structural change to the page set (add / delete / reorder / rename / switch).
    | { type: 'uframe:pagesChange', v: number, pages: PageDocument[], activePageId: string }
    | { type: 'uframe:activePageChange', v: number, pageId: string }
    // Edit to the shared context (variables / breakpoints / classes / symbols /
    // defaults) — host persists it independently of the document(s).
    | { type: 'uframe:globalsChange', v: number, globals: GlobalSettings }
    | { type: 'uframe:error', v: number, message: string }
    // Media: ask the host to open its native media library for `blockId`;
    // answered by a `uframe:setAsset` carrying the same `requestId`.
    | ({ type: 'uframe:requestAsset', v: number, requestId: string } & AssetRequest)

function isTagged(data: unknown): data is { type: string, v: number } {
  return (
    typeof data === 'object'
    && data !== null
    && typeof (data as { type?: unknown }).type === 'string'
    && (data as { type: string }).type.startsWith('uframe:')
  )
}

export function isHostMessage(data: unknown): data is HostMessage {
  return isTagged(data)
}

export function isEditorMessage(data: unknown): data is EditorMessage {
  return isTagged(data)
}
