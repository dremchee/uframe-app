<script setup lang="ts">
import type { Component } from 'vue'
import type { UframePanel } from '@/core'
import type { SidebarController, SidebarPanelAction } from '@/vue/composables/ui/useSidebar'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { ChevronsDownUp, ChevronsUpDown, PanelsTopLeft, Pin, PinOff } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { Button, Tooltip } from '@/components/ui'
import { findBlock } from '@/core'
import BlockLibraryPanel from '@/vue/components/BlockLibraryPanel.vue'
import ClassesPanel from '@/vue/components/ClassesPanel.vue'
import ComponentsPanel from '@/vue/components/ComponentsPanel.vue'
import HistoryPanel from '@/vue/components/HistoryPanel.vue'
import PagesPanel from '@/vue/components/PagesPanel.vue'
import PageTreePanel from '@/vue/components/PageTreePanel.vue'
import SettingsPanel from '@/vue/components/SettingsPanel.vue'
import VariablesPanel from '@/vue/components/VariablesPanel.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
  sidebar: SidebarController
  /** Plugin-contributed panels; the active one renders in place of built-ins. */
  panels?: UframePanel<Component>[]
}>()

const s = props.sidebar
const editor = props.editor
const { pluginSlots } = useEditorContext()
const { t } = useUframeI18n()
const settingsPanel = useTemplateRef<InstanceType<typeof SettingsPanel>>('settingsPanel')

function runPanelAction(command: SidebarPanelAction) {
  if (command.target === 'settings')
    settingsPanel.value?.runPanelAction(command)
}

defineExpose({ runPanelAction })

// The plugin panel whose id matches the active mode, if any.
const activePanel = computed(() => (props.panels ?? []).find(p => p.id === s.mode.value))

// Layers tree: while editing a component in place, scope it to that
// component's subtree only (otherwise the whole page). In isolated edit mode
// the document is already just the symbol root, so the full list is correct.
const layerBlocks = computed(() => {
  const scopeId = editor.editScopeRootId.value
  const blocks = editor.document.value.blocks
  if (!scopeId)
    return blocks
  const root = findBlock(blocks, scopeId)
  return root ? [root] : blocks
})

const slotParentId = computed(() => {
  if (!editor.editingSymbolId.value)
    return null
  const selected = editor.selectedBlock.value
  if (selected && selected.type !== 'slot' && editor.registry.value[selected.type]?.acceptsChildren)
    return selected.id
  const root = layerBlocks.value[0]
  return root && root.type !== 'slot' && editor.registry.value[root.type]?.acceptsChildren ? root.id : null
})

const btn = 'inline-flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text'
</script>

<template>
  <div class="flex flex-col h-full min-w-0 min-h-0 overflow-hidden bg-uf-panel">
    <div class="shrink-0 flex items-center gap-0.5 min-h-12 px-3.5 py-3 border-b border-uf-border">
      <h2 class="flex-1 m-0 text-sm font-bold truncate">
        {{ s.title.value }}
      </h2>
      <Tooltip v-if="s.mode.value === 'layers'" :text="s.allCollapsed.value ? t('sidebar.expandAll') : t('sidebar.collapseAll')">
        <button
          type="button"
          :class="btn"
          :aria-label="s.allCollapsed.value ? t('sidebar.expandAll') : t('sidebar.collapseAll')"
          @click="s.toggleCollapseAll()"
        >
          <component :is="s.allCollapsed.value ? ChevronsUpDown : ChevronsDownUp" :size="14" :stroke-width="1.75" />
        </button>
      </Tooltip>
      <Tooltip
        v-if="s.mode.value === 'pages' && editor.pageGroups.value.length > 0"
        :text="s.pagesAllCollapsed.value ? t('sidebar.expandAll') : t('sidebar.collapseAll')"
      >
        <button
          type="button"
          :class="btn"
          :aria-label="s.pagesAllCollapsed.value ? t('sidebar.expandAll') : t('sidebar.collapseAll')"
          @click="s.togglePagesCollapseAll()"
        >
          <component :is="s.pagesAllCollapsed.value ? ChevronsUpDown : ChevronsDownUp" :size="14" :stroke-width="1.75" />
        </button>
      </Tooltip>
      <Tooltip :text="s.pinned.value ? t('sidebar.unpin') : t('sidebar.pin')">
        <button
          type="button"
          :class="[btn, s.pinned.value && 'text-uf-accent-strong hover:text-uf-accent-strong']"
          :aria-label="s.pinned.value ? t('sidebar.unpin') : t('sidebar.pin')"
          @click="s.togglePin()"
        >
          <component :is="s.pinned.value ? Pin : PinOff" :size="14" :stroke-width="1.75" />
        </button>
      </Tooltip>
    </div>
    <div class="flex-1 min-h-0 flex flex-col">
      <div
        v-if="s.mode.value === 'layers' && editor.editingSymbolId.value"
        class="shrink-0 border-b border-uf-border p-2"
      >
        <Button
          variant="outline"
          size="sm"
          class="w-full justify-start text-uf-symbol hover:text-uf-symbol"
          :disabled="!slotParentId"
          @click="slotParentId && editor.addComponentSlot(slotParentId)"
        >
          <PanelsTopLeft data-icon="inline-start" />
          {{ t('sidebar.addSlot') }}
          <span class="ml-auto text-[10px] font-normal text-uf-muted">
            {{ slotParentId ? t('sidebar.addSlotToSelected') : t('sidebar.addSlotSelectContainer') }}
          </span>
        </Button>
      </div>
      <component
        :is="activePanel.component"
        v-if="activePanel"
        :editor="editor"
      />
      <PagesPanel
        v-else-if="s.mode.value === 'pages' && editor.isMultiPage.value"
        :editor="editor"
        :sidebar="s"
      />
      <BlockLibraryPanel
        v-else-if="s.mode.value === 'add'"
        :blocks="editor.blockDefinitions.value"
        @add="editor.addBlock"
      />
      <PageTreePanel
        v-else-if="s.mode.value === 'layers'"
        :blocks="layerBlocks"
        :selected-block-id="editor.selectedBlockId.value"
        :collapsed="s.collapsed"
        @select="(id) => { editor.selectBlock(id); editor.requestRevealBlock(id) }"
        @remove="editor.removeBlock"
        @toggle="s.toggleNode"
      />
      <ComponentsPanel
        v-else-if="s.mode.value === 'components'"
        :symbols="editor.symbols.value"
        @add-symbol="editor.addSymbolInstance"
        @remove-symbol="editor.deleteSymbol"
      />
      <VariablesPanel
        v-else-if="s.mode.value === 'variables'"
        :editor="editor"
      />
      <ClassesPanel
        v-else-if="s.mode.value === 'classes'"
        :editor="editor"
      />
      <HistoryPanel
        v-else-if="s.mode.value === 'history'"
        :editor="editor"
      />
      <SettingsPanel
        ref="settingsPanel"
        v-else-if="s.mode.value === 'settings'"
        :editor="editor"
        :sections="pluginSlots.settingsSections"
      />
    </div>
  </div>
</template>
