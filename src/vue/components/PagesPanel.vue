<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { PagesPanelApi } from '@/vue/composables/pages/pages-panel-context'
import type { SidebarController } from '@/vue/composables/ui/useSidebar'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { FolderPlus, Plus } from '@lucide/vue'
import { computed, provide, ref } from 'vue'
import { createUniqueName } from '@/core'
import PageGroupNode from '@/vue/components/PageGroupNode.vue'
import PageRow from '@/vue/components/PageRow.vue'
import { useGroupDropTarget } from '@/vue/composables/dnd/usePagesDnd'
import { PAGES_PANEL_KEY } from '@/vue/composables/pages/pages-panel-context'
import { buildGroupTree, moveGroupPath, renameGroupPath } from '@/vue/composables/pages/pages-tree'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
  sidebar: SidebarController
}>()

const editor = props.editor
const { t } = useUframeI18n()

// Transient groups created in the panel that have no pages yet (full paths).
// They merge with `editor.pageGroups` (groups that exist via pages) and de-dupe.
const localGroups = ref<string[]>([])
// Group collapse state is owned by the sidebar so the panel header's
// collapse/expand-all control can drive it (keyed by group path).
const collapsed = props.sidebar.pagesCollapsed

const pages = computed(() => editor.pagesView.value)
const ungrouped = computed(() => pages.value.filter(p => !p.group))
const canDelete = computed(() => pages.value.length > 1)

const allPaths = computed(() => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of [...localGroups.value, ...editor.pageGroups.value]) {
    if (p && !seen.has(p)) {
      seen.add(p)
      out.push(p)
    }
  }
  return out
})
const tree = computed(() => buildGroupTree(allPaths.value))
const hasGroups = computed(() => tree.value.length > 0)

function pagesIn(path: string) {
  return pages.value.filter(p => p.group === path)
}

// ── Local (transient) bookkeeping that mirrors a path rewrite/removal ────────
function rewriteLocal(fromPath: string, toPath: string) {
  localGroups.value = localGroups.value.map(g =>
    g === fromPath ? toPath : (g.startsWith(`${fromPath}/`) ? `${toPath}${g.slice(fromPath.length)}` : g),
  )
  for (const key of [...collapsed]) {
    if (key === fromPath || key.startsWith(`${fromPath}/`)) {
      collapsed.delete(key)
      collapsed.add(`${toPath}${key.slice(fromPath.length)}`)
    }
  }
}

// ── Group commands (drive the editor + keep transient/collapse state in sync) ─
function renameGroup(path: string, newName: string) {
  const toPath = renameGroupPath(path, newName)
  if (!toPath)
    return
  editor.renameGroup(path, newName)
  rewriteLocal(path, toPath)
}

function moveGroup(fromPath: string, toParent: string | null) {
  const toPath = moveGroupPath(fromPath, toParent)
  if (!toPath)
    return
  editor.moveGroup(fromPath, toParent)
  rewriteLocal(fromPath, toPath)
}

function deleteGroup(path: string) {
  // Ungroup the whole subtree (pages fall back to the ungrouped section).
  for (const page of pages.value) {
    if (page.group === path || page.group?.startsWith(`${path}/`))
      editor.setPageGroup(page.id, undefined)
  }
  localGroups.value = localGroups.value.filter(g => !(g === path || g.startsWith(`${path}/`)))
  for (const key of [...collapsed]) {
    if (key === path || key.startsWith(`${path}/`))
      collapsed.delete(key)
  }
}

function toggle(path: string) {
  if (collapsed.has(path))
    collapsed.delete(path)
  else collapsed.add(path)
}

function uniqueGroupName() {
  const base = t('pages.newGroup')
  return createUniqueName(base, allPaths.value, ' ')
}

function newGroup() {
  localGroups.value = [...localGroups.value, uniqueGroupName()]
}

// Drop a row onto another row: adopt the target's group, slot before/after it.
// Position is resolved against the target's *own group* (the visible section),
// not the full flat list — groups/ungrouped can interleave in the flat array,
// so a full-list index would land in the wrong spot.
function rowDrop(targetId: string, group: string | undefined, payload: { draggedId: string, edge: Edge | null }) {
  const { draggedId, edge } = payload
  if (draggedId === targetId)
    return
  const siblings = pages.value.filter(p => p.group === group && p.id !== draggedId)
  const ti = siblings.findIndex(p => p.id === targetId)
  if (ti === -1)
    return
  const beforeId = siblings[edge === 'bottom' ? ti + 1 : ti]?.id ?? null
  editor.movePage(draggedId, group, beforeId)
}

const api: PagesPanelApi = {
  editor,
  isCollapsed: path => collapsed.has(path),
  toggle,
  pagesIn,
  rename: renameGroup,
  remove: deleteGroup,
  add: path => editor.addPage(t('pages.untitled'), path),
  dropPage: (path, id) => editor.movePage(id, path, null),
  dropGroup: (parentPath, draggedPath) => moveGroup(draggedPath, parentPath),
  rowDrop,
}
provide(PAGES_PANEL_KEY, api)

// Top (ungrouped / root) drop zone: ungroup a page, or un-nest a group to root.
const ungroupedEl = ref<HTMLElement | null>(null)
const ungroupedOver = ref(false)
useGroupDropTarget({
  el: ungroupedEl,
  setOver: v => (ungroupedOver.value = v),
  onDropPage: id => editor.movePage(id, undefined, null),
  onDropGroup: path => moveGroup(path, null),
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="shrink-0 flex items-center gap-1.5 px-2 pt-2">
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-uf-border bg-transparent text-uf-text cursor-pointer transition-colors hover:bg-uf-panel-muted"
        @click="editor.addPage(t('pages.untitled'))"
      >
        <Plus :size="15" :stroke-width="1.75" />
        {{ t('pages.newPage') }}
      </button>
      <button
        type="button"
        class="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-uf-border bg-transparent text-uf-text cursor-pointer transition-colors hover:bg-uf-panel-muted"
        :title="t('pages.newGroup')"
        :aria-label="t('pages.newGroup')"
        @click="newGroup"
      >
        <FolderPlus :size="15" :stroke-width="1.75" />
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1 scrollbar-hide">
      <!-- Ungrouped pages: plain top-level rows + drop target to leave a group. -->
      <div
        ref="ungroupedEl"
        class="flex flex-col gap-0.5 rounded-md transition-colors"
        :class="ungroupedOver && 'ring-1 ring-uf-accent/40 bg-uf-accent/5'"
      >
        <PageRow
          v-for="page in ungrouped"
          :key="page.id"
          :page="page"
          :active="page.id === editor.activePageId.value"
          :can-delete="canDelete"
          :depth="0"
          @select="editor.selectPage(page.id)"
          @rename="(title: string) => editor.renamePage(page.id, title)"
          @remove="editor.removePage(page.id)"
          @drop="(p: { draggedId: string, edge: Edge | null }) => rowDrop(page.id, undefined, p)"
        />
        <p v-if="!ungrouped.length && hasGroups" class="px-2 py-1.5 text-[11px] italic text-uf-muted">
          {{ t('pages.dropToUngroup') }}
        </p>
      </div>

      <!-- Group tree. -->
      <PageGroupNode
        v-for="node in tree"
        :key="node.path"
        :node="node"
        :depth="0"
      />
    </div>
  </div>
</template>
