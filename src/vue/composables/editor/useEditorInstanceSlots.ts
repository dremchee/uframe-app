import type { ShallowRef } from 'vue'
import type { BlockRegistry, PageBlock, PageDocument, SymbolDefinition } from '@/core'
import {
  blockWouldCreateSymbolCycle,
  cloneBlockWithNewIds,
  COMPONENT_SLOT_BLOCK_TYPE,
  createBlock,
  createSymbolInstanceBlock,
  findBlock,
  getBlockPath,
  getInstanceSlotFills,
  getInstanceSymbolId,
  getSymbolSlots,
  moveBlockTo,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
  symbolDependsOn,
  updateBlockInTree,
} from '@/core'
import { makeEditorNodeId } from '@/vue/utils/symbol-editor'

export interface UseEditorInstanceSlotsOptions {
  document: ShallowRef<PageDocument>
  registry: ShallowRef<BlockRegistry>
  selectedBlockId: ShallowRef<string | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
}

/** Owns the fill tree attached to a particular component instance. */
export function useEditorInstanceSlots(options: UseEditorInstanceSlotsOptions) {
  const { document, registry, selectedBlockId, activeSymbols, commit } = options

  function resolveInstanceSlot(instanceId: string, slotId: string, blocks = document.value.blocks) {
    const instance = findBlock(blocks, instanceId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return undefined
    const symbolId = getInstanceSymbolId(instance)
    const symbol = symbolId ? activeSymbols()[symbolId] : undefined
    const slot = symbol ? getSymbolSlots(symbol).find(candidate => candidate.id === slotId) : undefined
    if (!symbol || !slot)
      return undefined
    const fill = getInstanceSlotFills(instance).find(candidate => candidate.props.slotId === slotId)
    return { instance, symbol, slot, fill }
  }

  function prepareInstanceSlotFill(instanceId: string, slotId: string) {
    const target = resolveInstanceSlot(instanceId, slotId)
    if (!target)
      return undefined
    if (target.fill)
      return { blocks: document.value.blocks, fillId: target.fill.id }

    const fill: PageBlock = {
      id: makeEditorNodeId('fill'),
      type: SYMBOL_SLOT_FILL_BLOCK_TYPE,
      props: { slotId },
      children: (target.slot.children ?? []).map(cloneBlockWithNewIds),
    }
    const blocks = updateBlockInTree(document.value.blocks, instanceId, current => ({
      ...current,
      children: [...(current.children ?? []), fill],
    }))
    return { blocks, fillId: fill.id }
  }

  function appendBlockToInstanceSlot(instanceId: string, slotId: string, block: PageBlock, label: string): boolean {
    const prepared = prepareInstanceSlotFill(instanceId, slotId)
    if (!prepared)
      return false
    const blocks = updateBlockInTree(prepared.blocks, prepared.fillId, current => ({
      ...current,
      children: [...(current.children ?? []), block],
    }))
    commit({ ...document.value, blocks }, label)
    selectedBlockId.value = block.id
    return true
  }

  function insertBlockIntoInstanceSlot(instanceId: string, slotId: string, blockType: string): boolean {
    const definition = registry.value[blockType]
    if (!definition || definition.availability === 'component')
      return false
    return appendBlockToInstanceSlot(instanceId, slotId, createBlock(definition), 'history.addBlockToSlot')
  }

  function insertSymbolIntoInstanceSlot(instanceId: string, slotId: string, symbolId: string): boolean {
    const target = resolveInstanceSlot(instanceId, slotId)
    if (!activeSymbols()[symbolId] || !target || symbolDependsOn(activeSymbols(), symbolId, target.symbol.id))
      return false
    return appendBlockToInstanceSlot(instanceId, slotId, createSymbolInstanceBlock(symbolId), 'history.addComponentToSlot')
  }

  function moveBlockIntoInstanceSlot(instanceId: string, slotId: string, sourceId: string): boolean {
    const source = findBlock(document.value.blocks, sourceId)
    if (!source || source.type === SYMBOL_SLOT_FILL_BLOCK_TYPE || source.type === COMPONENT_SLOT_BLOCK_TYPE)
      return false
    if (getBlockPath(document.value.blocks, instanceId).some(block => block.id === sourceId))
      return false

    const target = resolveInstanceSlot(instanceId, slotId)
    if (!target || blockWouldCreateSymbolCycle(source, target.symbol.id, activeSymbols()))
      return false
    const prepared = prepareInstanceSlotFill(instanceId, slotId)
    if (!prepared)
      return false
    const blocks = moveBlockTo(prepared.blocks, sourceId, prepared.fillId, Number.MAX_SAFE_INTEGER)
    if (blocks === prepared.blocks)
      return false

    commit({ ...document.value, blocks }, 'history.moveBlockToSlot')
    selectedBlockId.value = source.id
    return true
  }

  function resetInstanceSlot(instanceId: string, slotId: string): boolean {
    const instance = findBlock(document.value.blocks, instanceId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const fill = getInstanceSlotFills(instance).find(candidate => candidate.props.slotId === slotId)
    if (!fill)
      return false
    const blocks = updateBlockInTree(document.value.blocks, instanceId, current => ({
      ...current,
      children: (current.children ?? []).filter(child => child.id !== fill.id),
    }))
    commit({ ...document.value, blocks }, 'history.resetComponentSlot')
    return true
  }

  return {
    insertBlockIntoInstanceSlot,
    insertSymbolIntoInstanceSlot,
    moveBlockIntoInstanceSlot,
    resetInstanceSlot,
    resolveInstanceSlot,
  }
}
