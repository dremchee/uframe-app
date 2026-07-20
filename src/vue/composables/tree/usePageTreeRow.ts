import type { Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Component as ComponentIcon, PanelsTopLeft } from '@lucide/vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, toRef, watch } from 'vue'
import {
  COMPONENT_SLOT_BLOCK_TYPE,
  DATA_ITEM_BLOCK_TYPE,
  DATA_LIST_BLOCK_TYPE,
  findBlock,
  findBlockParentId,
  getInstanceSymbolId,
  resolveSlotFillContext,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
} from '@/core'
import { cn } from '@/lib/utils'
import { useTreeNodeDnd } from '@/vue/composables/dnd/useTreeNodeDnd'
import { useUframeI18n } from '@/vue/i18n'
import { displayBlockLabel } from '@/vue/utils/block-label'

export interface UsePageTreeRowOptions {
  editor: PageEditorInstance
  block: () => PageBlock
  depth: () => number
  selected: () => boolean
  select: (id: string) => void
  el: Ref<HTMLElement | null>
  nameInput: Ref<HTMLInputElement | null>
  trailingHintElement: Ref<HTMLElement | null>
}

/**
 * Provides interactive state for one regular Layers-tree row. Rendering stays
 * in PageTreeRow; DnD, labels, hover and inline rename use the editor through
 * this focused controller.
 */
export function usePageTreeRow(options: UsePageTreeRowOptions) {
  const { editor, block, depth, selected, select, el, nameInput, trailingHintElement } = options
  const { t } = useUframeI18n()
  const isSymbolInstance = computed(() => block().type === SYMBOL_INSTANCE_BLOCK_TYPE)
  const isSlot = computed(() => block().type === COMPONENT_SLOT_BLOCK_TYPE)
  const isSlotFill = computed(() => block().type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
  const parentId = computed(() => findBlockParentId(editor.document.value.blocks, block().id) ?? null)
  const slot = computed(() =>
    isSlotFill.value
      ? resolveSlotFillContext(editor.document.value.blocks, editor.effectiveDocument.value.symbols, block().id)?.slot
      : undefined,
  )
  const isDataBlock = computed(() =>
    block().type === DATA_LIST_BLOCK_TYPE
    || block().type === DATA_ITEM_BLOCK_TYPE
    || !!(block().bindings && Object.keys(block().bindings!).length),
  )
  const symbol = computed(() => {
    if (!isSymbolInstance.value)
      return undefined
    const id = getInstanceSymbolId(block())
    return id ? editor.effectiveDocument.value.symbols?.[id] : undefined
  })
  const definition = computed(() =>
    isSymbolInstance.value ? undefined : editor.registry.value[block().type],
  )
  const icon = computed(() =>
    (isSlot.value || isSlotFill.value) ? PanelsTopLeft : (isSymbolInstance.value ? ComponentIcon : definition.value?.icon),
  )
  const acceptsChildren = computed(() =>
    isSlotFill.value || (!isSymbolInstance.value && !!definition.value?.acceptsChildren),
  )
  const label = computed(() => {
    if (isSlotFill.value)
      return slot.value?.props.name ?? t('layers.missingSlot')
    if (isSlot.value)
      return String((block().props as Record<string, unknown>).name ?? t('layers.unnamedSlot'))
    if (isSymbolInstance.value)
      return symbol.value?.name ?? t('layers.missingComponent')
    return displayBlockLabel(block(), definition.value, t)
  })
  const classesLabel = computed(() => (block().classes ?? []).map(name => `.${name}`).join(''))
  const trailingHint = computed(() => (isSlot.value || isSlotFill.value) ? t('layers.slot') : classesLabel.value)
  const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)
  const menuOpen = ref(false)
  const isNameEditing = shallowRef(false)
  const nameDraft = shallowRef('')
  const isHidden = computed(() => !!block().hidden)

  const isTrailingHintTruncated = shallowRef(false)

  function updateTrailingHintTruncation() {
    const element = trailingHintElement.value
    isTrailingHintTruncated.value = !!element && element.scrollWidth > element.clientWidth
  }

  useResizeObserver(trailingHintElement, updateTrailingHintTruncation)
  watch(trailingHint, async () => {
    await nextTick()
    updateTrailingHintTruncation()
  }, { flush: 'post' })

  function getSiblings(): string[] {
    const parent = parentId.value
    const siblings = parent === null
      ? editor.document.value.blocks
      : (findBlock(editor.document.value.blocks, parent)?.children ?? [])
    return siblings.map(sibling => sibling.id)
  }

  useTreeNodeDnd({
    el,
    blockId: toRef(() => block().id),
    parentId,
    acceptsChildren,
    onTreeDrop: (sourceId, targetParentId, targetIndex) => {
      editor.moveBlockTo(sourceId, targetParentId, targetIndex)
    },
    onLibraryDrop: (blockType, targetParentId, targetIndex) => {
      editor.insertBlock(blockType, targetParentId, targetIndex)
    },
    onLibrarySymbolDrop: (symbolId, targetParentId, targetIndex) => {
      editor.insertSymbolInstance(symbolId, targetParentId, targetIndex)
    },
    getSiblings,
    setDropPosition: (position) => {
      dropPosition.value = position
    },
  })

  const paddingLeft = computed(() => `calc(0.125rem + ${depth()} * 12px)`)
  const guideStyles = computed(() => {
    const guides: Array<{ left: string }> = []
    for (let index = 1; index < depth(); index++)
      guides.push({ left: `calc(0.125rem + ${index} * 12px + 7px)` })
    return guides
  })

  const DROP_LINE = 'after:content-[\'\'] after:absolute after:left-1 after:right-1 after:h-0.5 after:rounded-sm after:bg-uf-accent after:pointer-events-none'
  const DROP_INSIDE = 'bg-uf-accent/14 shadow-[inset_0_0_0_1px_var(--color-uf-accent)]'
  const isHovered = computed(() => {
    const hoveredId = editor.hoverSource.value === 'tree' ? editor.hoveredBlockId.value : editor.syncedHoverId.value
    return hoveredId === block().id
  })
  const actionBackdrop = computed(() => {
    if (selected()) {
      return {
        gradient: 'via-[color-mix(in_srgb,var(--uf-accent)_14%,var(--uf-panel))] to-[color-mix(in_srgb,var(--uf-accent)_14%,var(--uf-panel))]',
        solid: 'bg-[color-mix(in_srgb,var(--uf-accent)_14%,var(--uf-panel))]',
      }
    }
    if (isHovered.value) {
      return { gradient: 'via-uf-panel-muted to-uf-panel-muted', solid: 'bg-uf-panel-muted' }
    }
    return { gradient: 'via-uf-panel to-uf-panel', solid: 'bg-uf-panel' }
  })
  const itemClass = computed(() => cn(
    'group/item',
    'relative flex items-center gap-0.5 w-full h-8 px-1 rounded-sm cursor-grab active:cursor-grabbing transition-colors',
    'text-uf-text text-[12px] text-left',
    !selected() && isHovered.value && 'bg-uf-panel-muted',
    selected() && 'bg-uf-accent/14 text-uf-accent-strong',
    dropPosition.value === 'before' && `${DROP_LINE} after:-top-px`,
    dropPosition.value === 'after' && `${DROP_LINE} after:-bottom-px`,
    dropPosition.value === 'inside' && DROP_INSIDE,
  ))

  const canRename = computed(() => !isSymbolInstance.value && !isSlot.value && !isSlotFill.value)
  const fallbackLabel = computed(() => displayBlockLabel({ type: block().type }, definition.value, t))

  function startNameEdit() {
    if (!canRename.value)
      return
    select(block().id)
    nameDraft.value = block().name ?? label.value
    isNameEditing.value = true
    void nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }

  function commitNameEdit() {
    if (!isNameEditing.value)
      return
    const name = nameDraft.value.trim()
    editor.setBlockName(block().id, !block().name && name === fallbackLabel.value ? '' : name)
    isNameEditing.value = false
  }

  function cancelNameEdit() {
    isNameEditing.value = false
    nameDraft.value = ''
  }

  function onDblClick() {
    if (isSymbolInstance.value)
      editor.enterInstanceMasterEdit(block().id)
    else
      startNameEdit()
  }

  function onEnter() {
    editor.setHoveredBlock(block().id, 'tree')
  }

  function onLeave() {
    if (editor.hoveredBlockId.value === block().id)
      editor.setHoveredBlock(null, 'tree')
  }

  return {
    actionBackdrop,
    canRename,
    cancelNameEdit,
    commitNameEdit,
    dropPosition,
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
  }
}
