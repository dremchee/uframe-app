import type { Component, InjectionKey, Ref } from 'vue'
import type { AssetPick, AssetRequest, EditorFeatureFlags, NormalizedSchema, PageDocument, ResolveContext, UframePanel } from '@/core'
import type { usePageEditor } from '@/vue/composables/editor/usePageEditor'
import { inject } from 'vue'

export type PageEditorInstance = ReturnType<typeof usePageEditor>

/** Plugin-contributed UI mounted by the chrome (toolbar clusters, panels, …). */
export interface PluginSlots {
  toolbarLeft: Component[]
  toolbarRight: Component[]
  panels: UframePanel<Component>[]
  /** Free-floating layers mounted at the editor-shell root. */
  overlays: Component[]
  /** Layers rendered inside the canvas overlay (canvas coordinate space). */
  canvasLayers: Component[]
  /** Sections injected into the built-in Settings panel. */
  settingsSections: Component[]
}

/** A border-box in canvas-overlay coordinates (relative to the frame). */
export interface CanvasAnchorRect { top: number, left: number, width: number, height: number }

/** Runtime-only container-query preview shared by the properties panel and canvas. */
export interface ContainerPreviewChannel {
  /** Whether the editor is styling against container width instead of viewport width. */
  active: Ref<boolean>
  blockId: Ref<string | null>
  /** Name of the query context to proxy onto the preview target. */
  containerName: Ref<string | null>
  /** Current queryable inline size (the container's content box), in CSS pixels. */
  width: Ref<number | null>
  /** Temporary border-box width applied inside the editor canvas only. */
  overrideWidth: Ref<number | null>
  highlighted: Ref<boolean>
  setActive: (active: boolean) => void
  show: (blockId: string, containerName: string | null) => void
  hide: () => void
  reportWidth: (width: number | null) => void
  setOverrideWidth: (width: number | null) => void
  setHighlighted: (highlighted: boolean) => void
}

/**
 * Canvas geometry and state published by the canvas for plugin overlays and
 * in-canvas layers. `paneEl` is the scrollable canvas pane (clamp bounds for
 * floating overlays); `frameEl` is the iframe, whose viewport offset converts
 * overlay-relative coordinates to viewport coordinates. `selectionRect` /
 * `selectionRadius` mirror the current selection box so a layer can trace it.
 * `busy` is set by a plugin working over the selection; the canvas suppresses
 * its own selection outline while it is true.
 */
export interface CanvasChannel {
  paneEl: Ref<HTMLElement | null>
  frameEl: Ref<HTMLElement | null>
  selectionRect: Ref<CanvasAnchorRect | null>
  selectionRadius: Ref<string | null>
  busy: Ref<boolean>
  containerPreview: ContainerPreviewChannel
}

export interface PageEditorContext {
  editor: PageEditorInstance
  lastSavedAt: Ref<number | null>
  autosaveError: Ref<Error | null>
  /** Resolved editor feature flags (defaults applied; all definite booleans). */
  features: Required<EditorFeatureFlags>
  /** Host-supplied CMS schema for the binding picker (empty when none). */
  schema: Ref<NormalizedSchema>
  /** Host-supplied sample data for previewing bound / repeated blocks. */
  dataContext: Ref<ResolveContext | undefined>
  /**
   * Host-driven media picker: the editor calls this to let the host open its
   * native media library, resolving to the chosen asset (or null if cancelled).
   * Absent when the host wired no picker — the media control hides.
   */
  requestAsset?: (req: AssetRequest) => Promise<AssetPick | null>
  save: () => void
  pluginSlots: PluginSlots
  /** Canvas geometry + state, published by the canvas for plugin layers. */
  canvas: CanvasChannel
  /**
   * The document may carry untrusted content (multi-tenant / CMS relay): embed
   * blocks render in a sandboxed iframe instead of inlining their HTML.
   */
  untrustedEmbeds: boolean
  emit: {
    save: (document: PageDocument) => void
  }
}

export const pageEditorContextKey: InjectionKey<PageEditorContext> = Symbol('PageEditorContext')

export function useEditorContext(): PageEditorContext {
  const ctx = inject(pageEditorContextKey)
  if (!ctx)
    throw new Error('useEditorContext must be used within a PageEditor')
  return ctx
}
