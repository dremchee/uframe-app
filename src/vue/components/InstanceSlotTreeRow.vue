<script setup lang="ts">
import type { VirtualSlotLayerRow } from '@/vue/utils/layer-tree'
import { ChevronRight, PanelsTopLeft } from '@lucide/vue'
import { computed, ref, toRef, useTemplateRef } from 'vue'
import { treeRowDomId } from '@/core'
import { cn } from '@/lib/utils'
import { useTreeNodeDnd } from '@/vue/composables/dnd/useTreeNodeDnd'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  row: VirtualSlotLayerRow
  selected: boolean
}>()

const emit = defineEmits<{
  activate: []
  toggle: []
  dropBlock: [sourceId: string]
  dropBlockType: [blockType: string]
  dropSymbol: [symbolId: string]
}>()

const { t } = useUframeI18n()

const el = useTemplateRef<HTMLElement>('el')
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

useTreeNodeDnd({
  el,
  blockId: toRef(() => props.row.key),
  parentId: toRef(() => props.row.parentKey),
  acceptsChildren: ref(true),
  draggableSource: false,
  insideOnly: true,
  onTreeDrop: sourceId => emit('dropBlock', sourceId),
  onLibraryDrop: blockType => emit('dropBlockType', blockType),
  onLibrarySymbolDrop: symbolId => emit('dropSymbol', symbolId),
  getSiblings: () => [props.row.key],
  setDropPosition: (position) => {
    dropPosition.value = position
  },
})

const paddingLeft = computed(() => `calc(0.125rem + ${props.row.depth + 1} * 12px)`)
const guideStyles = computed(() => {
  const out: Array<{ left: string }> = []
  for (let i = 1; i < props.row.depth + 1; i++)
    out.push({ left: `calc(0.125rem + ${i} * 12px + 7px)` })
  return out
})

const itemClass = computed(() => cn(
  'group/item relative flex h-8 w-full items-center gap-0.5 rounded-sm px-1 text-left text-[12px] transition-colors',
  'cursor-default text-uf-symbol',
  props.selected && 'bg-uf-symbol/12',
  !props.selected && 'hover:bg-uf-panel-muted',
  dropPosition.value === 'inside' && 'bg-uf-symbol/14 shadow-[inset_0_0_0_1px_var(--color-uf-symbol)]',
))
</script>

<template>
  <div
    :id="treeRowDomId(row.key)"
    ref="el"
    :class="itemClass"
    :style="{ paddingLeft }"
    role="treeitem"
    :aria-level="row.depth + 2"
    :aria-selected="selected"
    :aria-expanded="row.hasChildren ? row.expanded : undefined"
    :aria-label="t('layers.slotAria', { name: row.name })"
    @click.stop="emit('activate')"
  >
    <span
      v-for="(guide, index) in guideStyles"
      :key="index"
      class="pointer-events-none absolute inset-y-0 w-px bg-uf-border"
      :style="guide"
      aria-hidden="true"
    />

    <button
      v-if="row.hasChildren"
      type="button"
      class="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm bg-transparent text-uf-muted transition-transform hover:bg-black/6 hover:text-uf-text"
      :class="row.expanded && 'rotate-90'"
      :aria-label="row.expanded ? t('layers.collapseSlot') : t('layers.expandSlot')"
      @click.stop="emit('toggle')"
    >
      <ChevronRight :size="12" :stroke-width="2" />
    </button>
    <span v-else class="inline-block size-3.5 shrink-0" aria-hidden="true" />

    <PanelsTopLeft class="shrink-0" :size="12" :stroke-width="1.75" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate font-medium">{{ row.name }}</span>
    <!-- No row actions: Slot overrides are managed at the component level
         (the instance's Slots section in the properties panel). -->
    <span class="shrink-0 text-[11px] font-normal text-uf-muted">{{ t('layers.slot') }}</span>
  </div>
</template>
