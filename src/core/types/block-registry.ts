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

/**
 * A child block described by a preset: its `type` plus optional props,
 * insert-time styles and nested children. Resolved against the registry when
 * the preset is instantiated; a type the registry lacks is skipped.
 */
export interface BlockPresetChild {
  type: string
  props?: Record<string, unknown>
  style?: BaseBlockStyles
  children?: BlockPresetChild[]
}

/**
 * A named starting point for a block type — an extra card in the Add panel
 * that creates the same type with preset props, insert-time styles and,
 * optionally, a starter subtree. Presets exist only at insertion: the document
 * stores an ordinary block of the owning type with an editable name seeded from
 * the preset label (no preset id), so
 * the block's settings and quick panel are those of its type. Variations that
 * differ by styles alone (a column stack vs. a grid) belong here; a block that
 * needs props of its own is a separate type.
 */
export interface BlockPreset<TProps = Record<string, unknown>, TComponent = unknown> {
  /** Stable id, unique within the owning block type. */
  id: string
  label: string
  /** Optional i18n key for the Add-panel label. */
  labelKey?: string
  description?: string
  /** Optional i18n key for the Add-panel description. */
  descriptionKey?: string
  /** Defaults to the owning definition's icon. */
  icon?: TComponent
  /** Merged over the definition's `defaultProps`. */
  props?: Partial<TProps>
  /** Merged over the definition's `defaultStyle` into the block's local styles. */
  style?: BaseBlockStyles
  /** Starter subtree, resolved against the registry on insertion. */
  children?: BlockPresetChild[]
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
   * provide `element` instead. The editor forwards a block's root HTML
   * attributes as Vue fallthrough attributes; multi-root components must bind
   * `$attrs` to the element that represents the block.
   */
  renderComponent?: TComponent
  /**
   * Neutral render: tag name of a registered custom element, hosted by the
   * editor when `renderComponent` is absent. Framework-agnostic path.
   */
  element?: string
  settingsComponent?: TComponent
  /**
   * Compact layout controls for this block type. Bound like a Style-panel
   * section — `modelValue` / `update:modelValue` carry the active
   * `BaseBlockStyles` slice (breakpoint + state aware), and the selected
   * `block` is passed alongside — so edits land in the same class or block the
   * properties panel targets. The editor mounts it twice: as the Quick layout
   * section of the properties panel and, on request, as a floating panel next
   * to the block on the canvas, where a `compact` prop asks for the essentials.
   */
  quickPanel?: TComponent
  /**
   * Alternative starting points for this type, listed in the Add panel next to
   * the plain block card. See `BlockPreset`.
   */
  presets?: BlockPreset<TProps, TComponent>[]
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
