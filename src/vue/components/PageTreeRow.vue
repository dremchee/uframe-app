<script setup lang="ts">
import type { PageBlock } from '@/core'
import { ChevronRight, Ellipsis, EyeOff } from '@lucide/vue'
import { useTemplateRef } from 'vue'
import { treeRowDomId } from '@/core'
import { cn } from '@/lib/utils'
import BlockActionsMenu from '@/vue/components/BlockActionsMenu.vue'
import { usePageTreeRow } from '@/vue/composables/tree/usePageTreeRow'
import { useEditorContext } from '@/vue/context/editor-context'

const props = defineProps<{
  block: PageBlock
  depth: number
  hasChildren: boolean
  expanded: boolean
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
  toggle: [id: string]
}>()

const { editor } = useEditorContext()
const el = useTemplateRef<HTMLElement>('el')
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const trailingHintElement = useTemplateRef<HTMLElement>('trailingHintElement')
const {
  actionBackdrop,
  canRename,
  cancelNameEdit,
  commitNameEdit,
  guideStyles,
  icon,
  isDataBlock,
  isHidden,
  isNameEditing,
  isSlot,
  isSlotFill,
  isSymbolInstance,
  isTrailingHintTruncated,
  itemClass,
  label,
  menuOpen,
  nameDraft,
  onDblClick,
  onEnter,
  onLeave,
  paddingLeft,
  startNameEdit,
  t,
  trailingHint,
} = usePageTreeRow({
  editor,
  block: () => props.block,
  depth: () => props.depth,
  selected: () => props.selected,
  select: id => emit('select', id),
  el,
  nameInput,
  trailingHintElement,
})
</script>

<template>
  <div
    :id="treeRowDomId(block.id)"
    ref="el"
    :class="itemClass"
    :style="{ paddingLeft }"
    role="treeitem"
    :aria-level="depth + 1"
    :aria-selected="selected"
    :aria-expanded="hasChildren ? expanded : undefined"
    @click.stop="emit('select', block.id)"
    @dblclick.stop="onDblClick"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <span
      v-for="(guide, i) in guideStyles"
      :key="i"
      class="absolute top-0 bottom-0 w-px bg-uf-border pointer-events-none"
      :style="guide"
      aria-hidden="true"
    />
    <button
      v-if="hasChildren"
      type="button"
      class="flex-none inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-transparent text-uf-muted cursor-pointer transition-transform hover:bg-black/6 hover:text-uf-text"
      :class="expanded && 'rotate-90'"
      :aria-label="expanded ? t('layers.collapse') : t('layers.expand')"
      @click.stop="emit('toggle', block.id)"
    >
      <ChevronRight :size="12" :stroke-width="2" />
    </button>
    <span v-else class="flex-none inline-block w-3.5 h-3.5 pointer-events-none" aria-hidden="true" />

    <!-- A hidden element swaps its type icon for the closed eye. -->
    <component
      :is="isHidden ? EyeOff : icon"
      v-if="icon || isHidden"
      :class="cn(
        'flex-none',
        (isSymbolInstance || isSlot || isSlotFill) ? 'text-uf-symbol' : isDataBlock ? 'text-uf-data' : selected ? 'text-uf-accent-strong' : 'text-uf-muted',
      )"
      :size="12"
      :stroke-width="1.75"
      :aria-label="isHidden ? t('layers.hidden') : undefined"
      :aria-hidden="isHidden ? undefined : 'true'"
    />

    <input
      v-if="isNameEditing"
      ref="nameInput"
      v-model="nameDraft"
      type="text"
      class="flex-1 min-w-0 h-6 px-1 border border-uf-accent rounded-sm bg-uf-panel text-[12px] text-uf-text outline-none"
      :aria-label="t('layers.renameElement')"
      @blur="commitNameEdit"
      @click.stop
      @dblclick.stop
      @pointerdown.stop
      @keydown.enter.prevent="commitNameEdit"
      @keydown.escape.prevent="cancelNameEdit"
    >
    <span
      v-else
      :class="cn(
        'flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis font-medium',
        canRename && 'cursor-text',
        (isSymbolInstance || isSlot || isSlotFill) && 'text-uf-symbol',
        isDataBlock && 'text-uf-data',
        isHidden && 'opacity-50',
      )"
      :title="canRename ? t('layers.renameElement') : undefined"
      @dblclick.stop="startNameEdit"
    >{{ label }}</span>

    <span
      v-if="trailingHint"
      ref="trailingHintElement"
      :class="cn(
        'flex-none max-w-[45%] overflow-hidden whitespace-nowrap text-ellipsis text-[11px] text-uf-muted',
        // A complete class hint reserves room for More. If it is already
        // truncated, More overlaps it and supplies the fade instead.
        !isTrailingHintTruncated && 'mr-5',
        isHidden && 'opacity-50',
      )"
      :title="trailingHint"
    >{{ trailingHint }}</span>

    <div
      v-if="!isSlotFill"
      :class="cn(
        // Keep the action above the trailing class hint. The gradient lets the
        // hint fade underneath it instead of reserving a fixed column for More.
        'absolute inset-y-0 right-1 z-10 inline-flex items-center pl-6',
        isTrailingHintTruncated && ['bg-linear-to-r from-transparent', actionBackdrop.gradient],
        'transition-opacity',
        (selected || menuOpen) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        'group-hover/item:opacity-100 group-hover/item:pointer-events-auto',
        'focus-within:opacity-100 focus-within:pointer-events-auto',
      )"
    >
      <BlockActionsMenu
        v-model:open="menuOpen"
        :block="block"
        :renamable="canRename"
        @rename="startNameEdit"
      >
        <button
          type="button"
          :class="cn(
            'inline-flex items-center justify-center w-4.5 h-4.5 p-0 rounded-sm text-uf-muted cursor-pointer transition-colors',
            actionBackdrop.solid,
            'hover:bg-black/8 hover:text-uf-text data-[state=open]:bg-black/8 data-[state=open]:text-uf-text',
          )"
          :aria-label="t('layers.actions')"
          @click.stop
          @pointerdown.stop
        >
          <Ellipsis :size="14" :stroke-width="1.75" />
        </button>
      </BlockActionsMenu>
    </div>
  </div>
</template>
