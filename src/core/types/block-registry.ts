import type { BaseBlockStyles } from '@/core/types/block-styles'
import type { PageBlock, PageDocument } from '@/core/types/page-document'
import type { StandardSchemaV1 } from '@/core/types/standard-schema'

export interface BlockHtmlContext {
  /** Pre-built class attribute value (per-block class + applied named classes). */
  classes: string
  /** Renders all children of the current block to HTML. */
  renderChildren: () => string
  /** HTML-escapes a string value for safe interpolation in attributes/text. */
  escape: (value: string) => string
  /**
   * The document may contain untrusted content (e.g. relayed from other users
   * in a multi-tenant host). Renderers that emit raw author HTML — the embed
   * block — must isolate it (sandboxed iframe) rather than inline it. Defaults
   * to `false` (the editor-authored, trusted model).
   */
  untrusted?: boolean
}

export type BlockHtmlRenderer<TProps = Record<string, unknown>> = (
  block: PageBlock<TProps>,
  ctx: BlockHtmlContext,
) => string

/**
 * Logical grouping of blocks in the Add panel. Keep the list small and
 * stable — the panel renders one section per distinct value in registry
 * order. Defaults to `Other` so unrecognised blocks still appear.
 */
export type BlockCategory
  = | 'Structure'
    | 'Basic'
    | 'Typography'
    | 'Media'
    | 'Forms'
    | 'Dynamic'
    | 'Other'

// A schema-driven settings field — the editor renders the widget and binds it to
// `props[key]`. Used by blocks without a Vue `settingsComponent` (the
// framework-neutral path). See `BlockDefinition.settings`.
export interface SettingsField {
  /** Prop key this field edits. */
  key: string
  /** Defaults to a title-cased `key`. */
  label?: string
  /** Optional i18n key for the field label. */
  labelKey?: string
  /** Widget; when omitted, inferred from the prop's default value type. */
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color'
  /** Options for `type: 'select'`. */
  options?: Array<{ label: string, labelKey?: string, value: string | number }>
  placeholder?: string
  /** Optional i18n key for the field placeholder. */
  placeholderKey?: string
}

export interface BlockDefinition<TProps = Record<string, unknown>, TComponent = unknown> {
  type: string
  label: string
  /** Optional i18n key for the block-library label. */
  labelKey?: string
  description?: string
  /** Optional i18n key for the block-library description. */
  descriptionKey?: string
  category?: BlockCategory
  /** Optional i18n key for the block-library category heading. */
  categoryKey?: string
  /** Where authors may create this block. Defaults to `both`. */
  availability?: 'page' | 'component' | 'both'
  defaultProps: TProps
  /**
   * Optional props validation, run on load. Accepts any Standard Schema
   * (zod 4 / valibot / arktype / …) — no schema means no prop validation.
   */
  propsSchema?: StandardSchemaV1<unknown, TProps>
  /**
   * Vue render component (Vue-native path). Neutral plugins omit this and
   * provide `element` instead.
   */
  renderComponent?: TComponent
  /**
   * Neutral render: tag name of a registered custom element, hosted by the
   * editor when `renderComponent` is absent. Framework-agnostic path.
   */
  element?: string
  settingsComponent?: TComponent
  /**
   * Schema-driven settings (Content tab) for blocks without a Vue
   * `settingsComponent`: `'auto'` infers fields from `defaultProps`, or pass an
   * explicit field list. Framework-neutral — the editor renders the form.
   */
  settings?: 'auto' | SettingsField[]
  /**
   * Prop keys that can bind to a CMS data path. The editor renders a Bindings
   * section in the block's settings panel — one field picker per key — that
   * writes `block.bindings[key]`. Independent of how settings are rendered
   * (`settingsComponent` or schema-driven). See dynamic-content-plan.md.
   */
  bindableProps?: string[]
  icon?: TComponent
  acceptsChildren?: boolean
  renderHtml?: BlockHtmlRenderer<TProps>
  /**
   * Static CSS contributed by this block type — emitted once per used type into
   * the canvas iframe and the exported `<head>`. Lets `renderComponent` /
   * `renderHtml` use classes instead of inline styles (the plugin's own scoped /
   * shadow styles don't travel to the export). Author it inline or import a file
   * as a string (`import css from './block.css?inline'`).
   */
  css?: string
  createBlock?: () => PageBlock<TProps>
  /** Editable default styles applied to new instances (user can change them). */
  defaultStyle?: BaseBlockStyles
}

export type BlockRegistry = Record<string, BlockDefinition>

export interface EditorFeatureFlags {
  autosave?: boolean
  history?: boolean
  hotkeys?: boolean
  preview?: boolean
}

export interface EditorStorageAdapter {
  load: () => PageDocument | null | Promise<PageDocument | null>
  save: (document: PageDocument) => void | Promise<void>
  clear?: () => void | Promise<void>
}

export interface EditorOptions {
  features?: EditorFeatureFlags
  storage?: EditorStorageAdapter
  readonly?: boolean
  labels?: Record<string, string>
}
