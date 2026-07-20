import type { BlockStyles, BreakpointDef, FontStyle } from '@/core/types/block-styles'

export const SYMBOL_INSTANCE_BLOCK_TYPE = '__symbol'
export const COMPONENT_SLOT_BLOCK_TYPE = 'slot'
export const SYMBOL_SLOT_FILL_BLOCK_TYPE = '__symbol_slot_fill'

export type PageViewport = 'responsive' | 'desktop' | 'tablet' | 'mobile'

export interface PageSettings {
  width: PageViewport
  background: string
  style?: BlockStyles
  /** User-defined responsive breakpoints; falls back to DEFAULT_BREAKPOINTS. */
  breakpoints?: BreakpointDef[]
}

// User-defined CSS custom properties, emitted into `:root` and referenced from
// style values as `var(--key)`. `type` is a UI hint (which input widget to
// show, which picker the token surfaces in) — it never constrains `value`,
// which may be any CSS string.
export type CssVarType = 'color' | 'size' | 'number' | 'font' | 'shadow' | 'other'

export interface CssVariable {
  /**
   * Stable CSS identifier (stored without the leading `--`), frozen at creation
   * and used in `var(--key)` references. Renaming a variable edits `name` (the
   * display label) only — never this — so references never break. Unique per set.
   */
  key: string
  /** Editable display label shown in the Variables panel + token pickers. */
  name: string
  /** Any CSS value: `#14b8a6`, `0 2px 8px rgba(0,0,0,.1)`, `'Inter', sans-serif`, even `var(--other)`. */
  value: string
  type: CssVarType
}

/**
 * Where the registered families come from:
 * - `google` / `bunny` — web providers, loaded via a stylesheet link.
 * - `custom` — a host-managed stylesheet URL, linked as-is.
 * - `local` — fonts installed on the designer's machine (Local Font Access
 *   API); nothing is loaded — they render in the canvas but an exported page
 *   only shows them if the visitor has the font too.
 */
export type FontProviderId = 'google' | 'bunny' | 'custom' | 'local'

/**
 * A font registered for the document set and offered in the font-family
 * control. Each font carries its own provider, so a project can mix Google,
 * Bunny, custom-URL and locally-installed fonts. System stacks are NOT stored
 * here — they live in a fixed list (SYSTEM_FONT_STACKS) and need no loading.
 */
export interface FontDef {
  /** Family name as the provider knows it, e.g. "Roboto", "Open Sans". */
  family: string
  /** Where this font loads from. */
  provider: FontProviderId
  /** Requested weights; falls back to [400] when empty. (Web providers only.) */
  weights?: number[]
  /** Requested faces along the italic axis; falls back to ['normal'] when empty. */
  styles?: FontStyle[]
  /** Character subsets to request (e.g. 'latin', 'cyrillic'); provider default when empty. */
  subsets?: string[]
  /** Stylesheet URL for the `custom` provider (linked as-is). */
  url?: string
}

/** Font loading config: the families the document set loads and offers. */
export interface FontConfig {
  families?: FontDef[]
}

// ── Dynamic content (CMS binding) ─────────────────────────────────────────────
// The document stays a pure design + binding artifact: it carries WHICH field a
// prop pulls from, never the value. `resolveDocument` swaps in real data on the
// frontend. See docs/plans/dynamic-content-plan.md.

/**
 * Map of `prop name → context path`, e.g. `{ content: 'item.title' }`. The path
 * is a dot-path rooted at a scope (`item.*` = nearest data block / page record,
 * `page.*` = page-level record). Resolved by `resolveDocument`; the block's own
 * `props` value stays as the editor-time fallback / preview.
 */
export type BlockBindings = Record<string, string>

/**
 * Intent-only transform for an asset — CMS-agnostic. The resolver/adapter
 * turns it into provider-specific URL params (Directus `/assets/<id>?width=…`,
 * Strapi formats, Payload sizes).
 */
export interface AssetTransform {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  format?: string
}

/**
 * A reference to a file in the host CMS's native media library — NOT a bare
 * URL (which breaks on domain/storage changes and carries no transforms). The
 * concrete URL is produced by `resolveDocument` via `context.resolveAsset`.
 * Lives on media blocks (`image`/`embed`/`link`) alongside `props.src`, which
 * stays the fallback for external (non-CMS) URLs. See cms-extension-plan §6.
 */
export interface AssetRef {
  /** Identifier of the CMS source (e.g. `'directus'`). */
  source: string
  /** File id within that source's media library. */
  id: string
  mime?: string
  transform?: AssetTransform
}

/** What the editor asks the host to pick from its media library. */
export interface AssetRequest {
  blockId: string
  kind: 'image' | 'file'
}

/**
 * The host's answer to an `AssetRequest`: the descriptor to persist plus an
 * already-resolvable `url` for the editor preview (no storage access needed).
 */
export interface AssetPick {
  ref: AssetRef
  url: string
  meta?: { width?: number, height?: number, mime?: string, alt?: string }
}

/** Query metadata for `data-list` / `data-item` blocks (no data). */
export interface BlockDataSource {
  /** Collection / singleton name in the host CMS. */
  collection: string
  /** `data-list` only — sort keys (`-field` = descending). */
  sort?: string[]
  /** `data-list` only — max rows. */
  limit?: number
  /** `data-list` only — opaque filter, interpreted by the adapter. */
  filter?: Record<string, unknown>
}

/** A repeating region bound to a collection; `children` is the per-row template. */
export const DATA_LIST_BLOCK_TYPE = 'data-list'
/** A single-record region (singleton or relation); `children` render once. */
export const DATA_ITEM_BLOCK_TYPE = 'data-item'

export interface PageBlock<TProps = Record<string, unknown>> {
  id: string
  type: string
  props: TProps
  /** Optional editor-only display name; does not affect rendered markup. */
  name?: string
  style?: BlockStyles
  classes?: string[]
  /** Custom `id` attribute emitted on the rendered element. */
  htmlId?: string
  /**
   * Hidden elements render with an inline `style="display: none"` — on the
   * canvas and in the export alike. A flag (not a style-layer entry), so
   * hiding never mints a class or a machine uf-block-<id> rule, beats any
   * class/combo display via inline specificity, and can't leak into a class
   * through the local-styles → auto-class extraction.
   */
  hidden?: boolean
  children?: PageBlock[]
  /** prop → context-path; resolved on the frontend by `resolveDocument`. */
  bindings?: BlockBindings
  /** Data query for `data-list` / `data-item` blocks. */
  source?: BlockDataSource
  /**
   * CMS media-library reference for `image`/`embed`/`link`; `resolveDocument`
   *  turns it into `props.src`. Takes precedence over an external `props.src`.
   */
  asset?: AssetRef
}

export interface SymbolVariant {
  id: string
  name: string
  // Names from document.styles applied to the master root at render time.
  // Reuses the existing class system rather than inventing per-variant
  // style overlays — variants are just "named class presets".
  classes: string[]
}

export type SymbolPropertyControlType
  = | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'color'
    | 'url'

export interface SymbolPropertyControl {
  type: SymbolPropertyControlType
  options?: Array<{ label: string, labelKey?: string, value: string | number }>
  placeholder?: string
  /** Optional i18n key for the control placeholder. */
  placeholderKey?: string
}

/**
 * One public property exposed by a component master. Instance values are keyed
 * by the stable `id`; `key` is the user-facing API name and may be renamed
 * without cascading through every page that uses a global component.
 */
export interface SymbolPropertyDefinition {
  id: string
  key: string
  label: string
  /** Optional i18n key for the public property label. */
  labelKey?: string
  target: {
    blockId: string
    prop: string
  }
  control: SymbolPropertyControl
}

export interface SymbolDefinition {
  id: string
  name: string
  // Master tree; the symbol's "root" block lives here with all its children.
  // IDs inside are stable so future per-instance overrides can key off them.
  root: PageBlock
  // Every symbol has at least one variant; the first one is created as Default.
  variants: SymbolVariant[]
  defaultVariantId: string
  /** Public props forwarded into blocks in the master tree. */
  properties?: SymbolPropertyDefinition[]
  updatedAt: string
}

// Intersection with Record so it satisfies the PageBlock<TProps> constraint
// (TProps extends Record<string, unknown> elsewhere in the registry).
export type SymbolInstanceBlockProps = {
  symbolId: string
  variantId?: string
  /** Public prop overrides keyed by SymbolPropertyDefinition.id. */
  propertyValues?: Record<string, unknown>
} & Record<string, unknown>

export interface PageDocument {
  id: string
  title: string
  /** Optional grouping label. Pages stay a flat list; the editor groups by this. */
  group?: string
  version: number
  blocks: PageBlock[]
  settings: PageSettings
  styles?: Record<string, BlockStyles>
  symbols?: Record<string, SymbolDefinition>
  variables?: CssVariable[]
  /** Web fonts + provider; the globals is the source of truth once a set exists. */
  fonts?: FontConfig
  updatedAt: string
}

/**
 * Context-level settings shared by every document in a set ("globals"). These live
 * ALONGSIDE the document, never inside it: the editor merges them into the
 * active document at render time via `mergeGlobalsIntoDocument`, but each
 * PageDocument is still saved clean. In the playground this rides in the same
 * persisted blob as `pages`; in a CMS (Directus) it's a singleton record.
 * See docs/plans/global-globals-settings-plan.md.
 *
 * Merge precedence (see `mergeGlobalsIntoDocument`):
 * - `variables` / `breakpoints` / `fonts` — the globals is the single source of
 *   truth whenever a shared context exists.
 * - `styles` / `symbols` — globals ∪ document, the document key wins (lets a page
 *   add local classes / inline symbols on top of the shared set).
 * - `defaults` — the document's own `settings.background` / `settings.style`
 *   override the globals default.
 */
export interface GlobalSettings {
  /** Design tokens emitted into `:root`. */
  variables?: CssVariable[]
  /** Responsive breakpoints; falls back to DEFAULT_BREAKPOINTS when empty. */
  breakpoints?: BreakpointDef[]
  /** Named class library, shared across pages. */
  styles?: Record<string, BlockStyles>
  /** Reusable components (globals header/footer, …), shared across pages. */
  symbols?: Record<string, SymbolDefinition>
  /** Web fonts + provider, loaded into the canvas and export and offered in the font control. */
  fonts?: FontConfig
  /** Page-level defaults a document may override. */
  defaults?: {
    background?: string
    style?: BlockStyles
  }
  version: number
  updatedAt: string
}

export interface TextBlockProps {
  content: string
}

export interface HeadingBlockProps {
  content: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ImageBlockProps {
  src: string
  alt?: string
  caption?: string
}

export type ButtonElement = 'link' | 'button' | 'submit' | 'reset'

export interface ButtonBlockProps {
  label: string
  /** Used only when `kind === 'link'` (default). */
  href: string
  /**
   * - 'link' (default) → renders `<a href>` (legacy behaviour).
   * - 'button' → renders `<button type="button">` — for in-form non-submit actions.
   * - 'submit' / 'reset' → renders `<button type="submit|reset">` — for forms.
   */
  kind?: ButtonElement
}

export interface SpacerBlockProps {
  height: number
}

export type SectionBlockProps = Record<string, never>

export type ContainerBlockProps = Record<string, never>

export type DivBlockProps = Record<string, never>

export interface SlotBlockProps {
  name: string
}

export type SymbolSlotFillBlockProps = {
  /** Stable PageBlock.id of the Slot block in the component master. */
  slotId: string
} & Record<string, unknown>

// Data blocks carry their query in `block.source` (not props); props stay empty.
export type DataListBlockProps = Record<string, never>

export type DataItemBlockProps = Record<string, never>

export interface LinkBlockProps {
  href: string
  target?: '_self' | '_blank' | '_parent' | '_top'
  rel?: string
}

export interface ListBlockProps {
  ordered?: boolean
}

export type ListItemBlockProps = Record<string, never>

export interface ParagraphBlockProps {
  content: string
}

export interface EmbedBlockProps {
  /** Arbitrary HTML rendered via v-html. Trust boundary: only the editor user can write here. */
  html: string
}

export type DividerBlockProps = Record<string, never>

// ── Forms ───────────────────────────────────────────────────────────────────
// The editor renders the markup; the host app handles submission. Each field
// carries `name` (used in form-data on POST) and most carry `required` so
// the browser's built-in validation kicks in.

export interface FormBlockProps {
  action?: string
  method?: 'get' | 'post'
  name?: string
}

export type InputFieldType = 'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'search' | 'date' | 'time'

export interface InputBlockProps {
  name: string
  type?: InputFieldType
  placeholder?: string
  value?: string
  required?: boolean
  disabled?: boolean
}

export interface TextAreaBlockProps {
  name: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
}

export interface LabelBlockProps {
  text: string
  /** id of the input the label is bound to. */
  for?: string
}

export interface CheckboxBlockProps {
  name: string
  label: string
  value?: string
  checked?: boolean
  required?: boolean
}

export interface RadioBlockProps {
  /** Radios in the same group share a `name`. */
  name: string
  label: string
  value: string
  checked?: boolean
  required?: boolean
}

export interface SelectBlockProps {
  name: string
  required?: boolean
  disabled?: boolean
}

export interface SelectOptionBlockProps {
  value: string
  label: string
  selected?: boolean
  disabled?: boolean
}
