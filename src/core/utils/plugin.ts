import type { BlockDefinition, BlockRegistry } from '@/core/types/block-registry'
import type { EditorStyleTokens } from '@/core/types/editor-ui-theme'

/**
 * A uframe plugin bundles block definitions and editor-chrome style tokens that
 * a host registers via `<PageEditor :plugins="[...]" />`. Keeping it a plain
 * data shape (no lifecycle) means plugins are just npm packages exporting an
 * object — the marketplace story without a runtime.
 */
/**
 * A custom left-sidebar panel: adds a rail item (icon + label) and renders
 * `component` when that mode is active. `id` becomes the sidebar mode key, so
 * keep it stable and unique across plugins.
 */
export interface UframePanel<TComponent = unknown> {
  id: string
  label: string
  /** Optional i18n key resolved through the editor's active locale. */
  labelKey?: string
  icon: TComponent
  component: TComponent
}

/**
 * `TComponent` is the host framework's component type (Vue `Component` in this
 * library); core stays framework-agnostic by leaving it `unknown` — the same
 * trick `BlockDefinition` uses for `renderComponent`.
 */
export interface UframePlugin<TComponent = unknown> {
  /** Identifier for debugging / dedupe; not required to be globally unique. */
  name: string
  /** Per-locale messages consumed by plugin components via `useUframeI18n()`. */
  messages?: Partial<Record<string, Record<string, unknown>>>
  /** Block definitions to register. Later entries win on a type collision. */
  blocks?: BlockDefinition[]
  /**
   * Prefix-free editor style tokens (e.g. `{ accent: '#7c3aed' }`). They are
   * converted to internal CSS properties by the editor. The canvas iframe is
   * a separate document and is intentionally unaffected.
   */
  styleTokens?: EditorStyleTokens
  /** Components appended to the toolbar's left / right clusters. */
  toolbarSlots?: { left?: TComponent[], right?: TComponent[] }
  /** Custom left-sidebar panels, each adding a rail mode. */
  panels?: UframePanel<TComponent>[]
  /**
   * Free-floating layers mounted at the editor-shell root — above the toolbar,
   * sidebar and canvas. Each positions itself (e.g. an AI chat window that
   * anchors within the canvas pane). Rendered in registration order.
   */
  overlays?: TComponent[]
  /**
   * Layers rendered inside the canvas overlay, in the canvas' coordinate space,
   * so they scroll and clip with the frame (e.g. a "generating" ring drawn over
   * the selected block). Read canvas geometry from the editor context.
   */
  canvasLayers?: TComponent[]
  /**
   * Sections injected into the built-in Settings panel (before the built-in
   * ones). Each receives the editor instance as an `editor` prop, mirroring
   * `panels`. Lets a plugin add its own configuration without owning a rail.
   */
  settingsSections?: TComponent[]
}

/** Identity helper that gives plugin authors type inference + checking. */
export function definePlugin<TComponent = unknown>(plugin: UframePlugin<TComponent>): UframePlugin<TComponent> {
  return plugin
}

/** Components contributed to one side of the toolbar, in registration order. */
export function collectToolbarSlots<TComponent>(
  plugins: UframePlugin<TComponent>[] | undefined,
  side: 'left' | 'right',
): TComponent[] {
  return (plugins ?? []).flatMap(p => p.toolbarSlots?.[side] ?? [])
}

/** Custom sidebar panels contributed by the plugins, in registration order. */
export function collectPanels<TComponent>(
  plugins: UframePlugin<TComponent>[] | undefined,
): UframePanel<TComponent>[] {
  return (plugins ?? []).flatMap(p => p.panels ?? [])
}

/** Shell-root floating overlays contributed by the plugins, in registration order. */
export function collectOverlays<TComponent>(
  plugins: UframePlugin<TComponent>[] | undefined,
): TComponent[] {
  return (plugins ?? []).flatMap(p => p.overlays ?? [])
}

/** In-canvas layers contributed by the plugins, in registration order. */
export function collectCanvasLayers<TComponent>(
  plugins: UframePlugin<TComponent>[] | undefined,
): TComponent[] {
  return (plugins ?? []).flatMap(p => p.canvasLayers ?? [])
}

/** Settings-panel sections contributed by the plugins, in registration order. */
export function collectSettingsSections<TComponent>(
  plugins: UframePlugin<TComponent>[] | undefined,
): TComponent[] {
  return (plugins ?? []).flatMap(p => p.settingsSections ?? [])
}

/** All block definitions contributed by the plugins, in registration order. */
export function collectPluginBlocks(plugins: UframePlugin[] | undefined): BlockDefinition[] {
  return (plugins ?? []).flatMap(p => p.blocks ?? [])
}

/**
 * Merges plugin blocks onto a base registry. Precedence is last-wins: a later
 * plugin (and any plugin over the base registry) overrides an earlier
 * definition of the same `type`. The base registry is not mutated.
 */
export function applyPlugins(base: BlockRegistry, plugins: UframePlugin[] | undefined): BlockRegistry {
  const merged: BlockRegistry = { ...base }
  for (const def of collectPluginBlocks(plugins))
    merged[def.type] = def
  return merged
}

/** Flattens plugin style tokens into one map; later plugins win on a key clash. */
export function mergeStyleTokens(plugins: UframePlugin[] | undefined): EditorStyleTokens {
  const out: EditorStyleTokens = {}
  for (const plugin of plugins ?? []) {
    if (plugin.styleTokens)
      Object.assign(out, plugin.styleTokens)
  }
  return out
}
