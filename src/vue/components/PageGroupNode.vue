<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { GroupNode } from '@/vue/composables/pages/pages-tree'
import { computed, inject } from 'vue'
import PageGroupHeader from '@/vue/components/PageGroupHeader.vue'
import PageRow from '@/vue/components/PageRow.vue'
import { PAGES_PANEL_KEY } from '@/vue/composables/pages/pages-panel-context'

const props = defineProps<{
  node: GroupNode
  depth: number
}>()

const api = inject(PAGES_PANEL_KEY)!

const pages = computed(() => api.pagesIn(props.node.path))
const collapsed = computed(() => api.isCollapsed(props.node.path))
const canDelete = computed(() => api.editor.pagesView.value.length > 1)
</script>

<template>
  <section class="flex flex-col gap-0.5">
    <PageGroupHeader
      :path="node.path"
      :name="node.name"
      :collapsed="collapsed"
      :depth="depth"
      @toggle="api.toggle(node.path)"
      @rename="(name: string) => api.rename(node.path, name)"
      @add="api.add(node.path)"
      @delete="api.remove(node.path)"
      @drop-page="(id: string) => api.dropPage(node.path, id)"
      @drop-group="(p: string) => api.dropGroup(node.path, p)"
    />

    <div v-show="!collapsed" class="flex flex-col gap-0.5">
      <!-- Pages and nested groups indent one level deeper (depth-based padding). -->
      <PageRow
        v-for="page in pages"
        :key="page.id"
        :page="page"
        :active="page.id === api.editor.activePageId.value"
        :can-delete="canDelete"
        :depth="depth + 1"
        @select="api.editor.selectPage(page.id)"
        @rename="(title: string) => api.editor.renamePage(page.id, title)"
        @remove="api.editor.removePage(page.id)"
        @drop="(payload: { draggedId: string, edge: Edge | null }) => api.rowDrop(page.id, node.path, payload)"
      />
      <PageGroupNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </section>
</template>
