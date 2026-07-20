import type { UframePanel } from '@/core'
import type { SidebarMode } from '@/vue/composables/editor/useEditorStorage'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, reactive, ref } from 'vue'
import { useUframeI18n } from '@/vue/i18n'
import { projectLayerTree } from '@/vue/utils/layer-tree'

const MODE_TITLE_KEYS: Record<SidebarMode, string> = {
  pages: 'sidebar.pages',
  add: 'sidebar.add',
  layers: 'sidebar.layers',
  components: 'sidebar.components',
  variables: 'sidebar.variables',
  classes: 'sidebar.classes',
  history: 'sidebar.history',
  settings: 'sidebar.settings',
}

const PANEL_MIN_WIDTH = 220
const PANEL_MAX_WIDTH = 560

/** A one-shot command for a built-in or plugin sidebar panel. */
export interface SidebarPanelAction {
  id: number
  target: string
  action: string
}

// Shared UI state for the left sidebar — owned once (in EditorShell) and passed
// to the rail and panel so the docked panel and the floating flyout share it.
export function useSidebar(editor: PageEditorInstance, panels: UframePanel[] = []) {
  const { t } = useUframeI18n()
  // Active mode and pinned/docked state are persisted in the editor instance's
  // own preference store (per-editor, not module-global).
  const storage = editor.storage
  // Mode is a built-in key or a plugin panel id (a plain string).
  const mode = computed<string>({
    get: () => storage.value.sidebarMode,
    set: (value) => { storage.value.sidebarMode = value },
  })
  // Pinned → docked column that pushes the canvas. Unpinned (default) → the
  // panel floats over the canvas as a flyout, opened from the rail and
  // dismissed on blur.
  const pinned = computed<boolean>({
    get: () => storage.value.sidebarPinned,
    set: (value) => { storage.value.sidebarPinned = value },
  })
  const flyoutOpen = ref(false)
  // Resizable width of the panel (docked or floating), clamped and persisted.
  const panelWidth = computed<number>({
    get: () => storage.value.sidebarWidth,
    set: (value) => {
      storage.value.sidebarWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.round(value)))
    },
  })

  const title = computed(() =>
    (MODE_TITLE_KEYS[mode.value as SidebarMode] ? t(MODE_TITLE_KEYS[mode.value as SidebarMode]) : undefined)
    ?? (() => {
      const panel = panels.find(p => p.id === mode.value)
      if (!panel)
        return ''
      const label = panel.labelKey ? t(panel.labelKey) : panel.label
      return label === panel.labelKey ? panel.label : label
    })(),
  )

  function selectMode(next: string) {
    mode.value = next
    if (!pinned.value)
      flyoutOpen.value = true
  }

  function togglePin() {
    pinned.value = !pinned.value
    // Docking hides the flyout; unpinning surfaces it immediately so it
    // doesn't vanish the moment you switch.
    flyoutOpen.value = !pinned.value
  }

  function closeFlyout() {
    flyoutOpen.value = false
  }

  // Tree collapse state lives here so the header's collapse/expand-all control
  // can drive it and it survives switching modes (or docked ↔ floating).
  const collapsed = reactive(new Set<string>())
  function toggleNode(id: string) {
    if (collapsed.has(id))
      collapsed.delete(id)
    else
      collapsed.add(id)
  }

  function collapsibleIds(): string[] {
    return projectLayerTree(
      editor.document.value.blocks,
      editor.effectiveDocument.value.symbols,
    ).filter(row => row.hasChildren).map(row => row.key)
  }

  const allCollapsed = computed(() => {
    const ids = collapsibleIds()
    return ids.length > 0 && ids.every(id => collapsed.has(id))
  })

  function toggleCollapseAll() {
    if (allCollapsed.value) {
      collapsed.clear()
      return
    }
    for (const id of collapsibleIds())
      collapsed.add(id)
  }

  // Collapse state for the Pages panel's groups (keyed by group path), lifted
  // here so the panel header's collapse/expand-all control can drive it — the
  // same pattern as the layers tree above.
  const pagesCollapsed = reactive(new Set<string>())
  const pagesAllCollapsed = computed(() => {
    const groups = editor.pageGroups.value
    return groups.length > 0 && groups.every(g => pagesCollapsed.has(g))
  })
  function togglePagesCollapseAll() {
    if (pagesAllCollapsed.value) {
      pagesCollapsed.clear()
      return
    }
    for (const g of editor.pageGroups.value)
      pagesCollapsed.add(g)
  }

  return {
    mode,
    pinned,
    flyoutOpen,
    panelWidth,
    title,
    collapsed,
    allCollapsed,
    selectMode,
    togglePin,
    closeFlyout,
    toggleNode,
    toggleCollapseAll,
    pagesCollapsed,
    pagesAllCollapsed,
    togglePagesCollapseAll,
  }
}

export type SidebarController = ReturnType<typeof useSidebar>
