<script setup lang="ts">
import type { PageBlock } from '@/core'
import type { LayerTreeRow, VirtualSlotLayerRow } from '@/vue/utils/layer-tree'
import { Globe } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import { treeRowDomId } from '@/core'
import { cn } from '@/lib/utils'
import InstanceSlotTreeRow from '@/vue/components/InstanceSlotTreeRow.vue'
import PageTreeRow from '@/vue/components/PageTreeRow.vue'
import { useTreeNodeDnd } from '@/vue/composables/dnd/useTreeNodeDnd'
import { usePageTreeNavigation } from '@/vue/composables/tree/usePageTreeNavigation'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  blocks: PageBlock[]
  selectedBlockId: string | null
  // Collapse state is owned by the sidebar so the header's collapse/expand-all
  // control can drive it and it survives switching panel modes.
  collapsed: Set<string>
}>()

const emit = defineEmits<{
  select: [id: string | null]
  remove: [id: string]
  toggle: [id: string]
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()

const treeRootEl = useTemplateRef<HTMLElement>('treeRootEl')
const {
  activateSlot,
  activeDescendant,
  activeRowKey,
  containerProps,
  focusTree,
  isEditingSymbol,
  list,
  onFocusIn,
  onFocusOut,
  onKeydown,
  rowHeight,
  selectLayerRow,
  wrapperProps,
} = usePageTreeNavigation({
  editor,
  blocks: () => props.blocks,
  collapsed: () => props.collapsed,
  selectedBlockId: () => props.selectedBlockId,
  treeRootEl,
  select: id => emit('select', id),
  toggle: id => emit('toggle', id),
})

const bodyEl = useTemplateRef<HTMLElement>('bodyEl')
const bodyDropPosition = ref<'before' | 'after' | 'inside' | null>(null)
const isBodySelected = computed(() => activeRowKey.value === null)

function ensureSlotExpanded(row: VirtualSlotLayerRow) {
  if (props.collapsed.has(row.instanceId))
    emit('toggle', row.instanceId)
  if (props.collapsed.has(row.key))
    emit('toggle', row.key)
}

function dropBlockIntoSlot(row: LayerTreeRow, sourceId: string) {
  if (row.kind === 'slot' && editor.moveBlockIntoInstanceSlot(row.instanceId, row.slotId, sourceId))
    ensureSlotExpanded(row)
}

function dropBlockTypeIntoSlot(row: LayerTreeRow, blockType: string) {
  if (row.kind === 'slot' && editor.insertBlockIntoInstanceSlot(row.instanceId, row.slotId, blockType))
    ensureSlotExpanded(row)
}

function dropSymbolIntoSlot(row: LayerTreeRow, symbolId: string) {
  if (row.kind === 'slot' && editor.insertSymbolIntoInstanceSlot(row.instanceId, row.slotId, symbolId))
    ensureSlotExpanded(row)
}

useTreeNodeDnd({
  el: bodyEl,
  blockId: ref('__pb_body__'),
  parentId: ref(null),
  acceptsChildren: ref(true),
  draggableSource: false,
  onTreeDrop: (sourceId) => {
    editor.moveBlockTo(sourceId, null, props.blocks.length)
  },
  onLibraryDrop: (blockType) => {
    editor.insertBlock(blockType, null, props.blocks.length)
  },
  onLibrarySymbolDrop: (symbolId) => {
    editor.insertSymbolInstance(symbolId, null, props.blocks.length)
  },
  getSiblings: () => [],
  setDropPosition: (pos) => {
    bodyDropPosition.value = pos === 'before' || pos === 'after' ? null : pos
  },
})

const bodyItemClass = computed(() => cn(
  'relative flex items-center gap-0.5 w-full h-8 px-1 rounded-sm cursor-pointer transition-colors',
  'text-uf-text text-[12px] font-bold text-left',
  !isBodySelected.value && 'hover:bg-uf-panel-muted',
  isBodySelected.value && 'bg-uf-accent/14 text-uf-accent-strong',
  bodyDropPosition.value === 'inside' && 'bg-uf-accent/14 shadow-[inset_0_0_0_1px_var(--color-uf-accent)]',
))
</script>

<template>
  <section class="flex flex-col min-h-0 h-full overflow-hidden pt-2">
    <div
      ref="treeRootEl"
      class="flex-1 min-h-0 flex flex-col outline-none"
      role="tree"
      tabindex="0"
      :aria-label="t('layers.pageStructure')"
      :aria-activedescendant="activeDescendant"
      @keydown="onKeydown"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
      @click="focusTree"
    >
      <!-- Body row stays outside the virtual list so it's always visible.
           Hidden via v-show while editing a symbol: there's no page-level
           scope, only the symbol's own root tree. We keep the DOM node so
           useTreeNodeDnd (mounted once with this ref) stays wired up for
           after symbol-edit exits. -->
      <div v-show="!isEditingSymbol" class="shrink-0 px-1">
        <div
          :id="treeRowDomId(null)"
          ref="bodyEl"
          :class="bodyItemClass"
          role="treeitem"
          :aria-level="1"
          :aria-selected="isBodySelected"
          @click.stop="selectLayerRow(null)"
        >
          <span class="flex-none inline-block w-3.5 h-3.5 pointer-events-none" aria-hidden="true" />
          <Globe class="flex-none text-uf-muted" :size="12" :stroke-width="1.75" aria-hidden="true" />
          <span class="flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis lowercase">{{ t('layers.body') }}</span>
        </div>
      </div>

      <!-- Virtualised list of tree rows. Body is always expanded. -->
      <div
        v-bind="containerProps"
        class="flex-1 min-h-0 px-1 pb-2 overflow-auto scrollbar-hide"
      >
        <div v-bind="wrapperProps">
          <template v-for="row in list" :key="row.data.key">
            <PageTreeRow
              v-if="row.data.kind === 'block'"
              :block="row.data.block"
              :depth="row.data.depth + 1"
              :has-children="row.data.hasChildren"
              :expanded="row.data.expanded"
              :selected="row.data.key === activeRowKey"
              :style="{ height: `${rowHeight}px` }"
              @select="selectLayerRow"
              @remove="(id) => emit('remove', id)"
              @toggle="(id) => emit('toggle', id)"
            />
            <InstanceSlotTreeRow
              v-else
              :row="row.data"
              :selected="row.data.key === activeRowKey"
              :style="{ height: `${rowHeight}px` }"
              @activate="activateSlot(row.data)"
              @toggle="emit('toggle', row.data.key)"
              @drop-block="sourceId => dropBlockIntoSlot(row.data, sourceId)"
              @drop-block-type="blockType => dropBlockTypeIntoSlot(row.data, blockType)"
              @drop-symbol="symbolId => dropSymbolIntoSlot(row.data, symbolId)"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
