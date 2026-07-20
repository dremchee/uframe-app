import type { ShallowRef } from 'vue'
import type { BlockRegistry, PageBlock, PageDocument, SymbolDefinition } from '@/core'
import {
  COMPONENT_SLOT_BLOCK_TYPE,
  createBlock,
  findBlock,
  getBlockPath,
  insertBlockInTree,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
  uniqueSymbolSlotName,
} from '@/core'
import { useEditorInstanceSlots } from './useEditorInstanceSlots'

export interface UseEditorSymbolSlotsOptions {
  document: ShallowRef<PageDocument>
  registry: ShallowRef<BlockRegistry>
  editingSymbolId: ShallowRef<string | null>
  editScopeRootId: ShallowRef<string | null>
  selectedBlockId: ShallowRef<string | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
}

/** Owns Slot authoring and per-instance Slot-fill mutations. */
export function useEditorSymbolSlots(options: UseEditorSymbolSlotsOptions) {
  const {
    document,
    registry,
    editingSymbolId,
    editScopeRootId,
    selectedBlockId,
    activeSymbols,
    commit,
  } = options
  const instanceSlots = useEditorInstanceSlots({ document, registry, selectedBlockId, activeSymbols, commit })

  function addComponentSlot(parentId: string, index = Number.MAX_SAFE_INTEGER, preferredName = 'content'): string | false {
    const symbolId = editingSymbolId.value
    const symbol = symbolId ? activeSymbols()[symbolId] : undefined
    const parent = findBlock(document.value.blocks, parentId)
    if (!symbol || !parent || !registry.value[parent.type]?.acceptsChildren)
      return false
    const path = getBlockPath(document.value.blocks, parentId)
    if (path.some(block =>
      block.type === COMPONENT_SLOT_BLOCK_TYPE
      || block.type === SYMBOL_INSTANCE_BLOCK_TYPE
      || block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE,
    )) {
      return false
    }
    const scopeRoot = editScopeRootId.value ?? document.value.blocks[0]?.id
    const scopeRootBlock = scopeRoot ? findBlock(document.value.blocks, scopeRoot) : undefined
    if (!scopeRootBlock || (parentId !== scopeRoot && !getBlockPath([scopeRootBlock], parentId).length))
      return false

    const definition = registry.value[COMPONENT_SLOT_BLOCK_TYPE]
    if (!definition)
      return false
    const liveSymbol = { ...symbol, root: scopeRootBlock }
    const slot = createBlock(definition, { name: uniqueSymbolSlotName(liveSymbol, preferredName) }) as PageBlock
    const blocks = insertBlockInTree(document.value.blocks, parentId, index, slot)
    commit({ ...document.value, blocks }, 'history.addComponentSlot')
    selectedBlockId.value = slot.id
    return slot.id
  }

  return {
    addComponentSlot,
    ...instanceSlots,
  }
}
