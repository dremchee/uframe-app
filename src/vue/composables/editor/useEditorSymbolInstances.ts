import type { ShallowRef } from 'vue'
import type { GlobalSettings, PageBlock, PageDocument, SymbolDefinition } from '@/core'
import {
  cloneBlockWithNewIds,
  COMPONENT_SLOT_BLOCK_TYPE,
  createSymbolDefinitionFromBlock,
  createSymbolInstanceBlock,
  findBlock,
  insertBlockInTree,
  mapBlockTree,
  materializeSymbolInstance,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  updateBlockInTree,
} from '@/core'

export interface UseEditorSymbolInstancesOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  selectedBlockId: ShallowRef<string | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitBoth: (document: PageDocument, globals: GlobalSettings, label?: string) => void
  resolveDefaultInsertion: () => { parentId: string | null, index?: number }
  spliceBlockInto: (block: PageBlock, parentId: string | null, index: number | undefined, label: string) => void
}

/** Owns component instance creation, insertion and detachment. */
export function useEditorSymbolInstances(options: UseEditorSymbolInstancesOptions) {
  const {
    document,
    globals,
    selectedBlockId,
    activeSymbols,
    commit,
    commitBoth,
    resolveDefaultInsertion,
    spliceBlockInto,
  } = options

  function saveBlockAsSymbol(blockId: string, name: string): string | false {
    const trimmedName = name.trim()
    if (!trimmedName)
      return false
    const block = findBlock(document.value.blocks, blockId)
    if (!block || block.type === SYMBOL_INSTANCE_BLOCK_TYPE)
      return false

    const symbol = createSymbolDefinitionFromBlock(trimmedName, block)
    const symbols = { ...activeSymbols(), [symbol.id]: symbol }
    const instance = createSymbolInstanceBlock(symbol.id)
    const blocks = updateBlockInTree(document.value.blocks, blockId, () => instance)
    if (globals.value)
      commitBoth({ ...document.value, blocks }, { ...globals.value, symbols }, 'history.saveComponent')
    else
      commit({ ...document.value, symbols, blocks }, 'history.saveComponent')
    selectedBlockId.value = instance.id
    return symbol.id
  }

  function insertSymbolInstance(symbolId: string, parentId: string | null, index: number): boolean {
    if (!activeSymbols()[symbolId])
      return false
    const instance = createSymbolInstanceBlock(symbolId)
    const blocks = insertBlockInTree(document.value.blocks, parentId, index, instance)
    commit({ ...document.value, blocks }, 'history.insertComponent')
    selectedBlockId.value = instance.id
    return true
  }

  function addSymbolInstance(symbolId: string): boolean {
    if (!activeSymbols()[symbolId])
      return false
    const instance = createSymbolInstanceBlock(symbolId)
    const target = resolveDefaultInsertion()
    spliceBlockInto(instance, target.parentId, target.index, 'history.insertComponent')
    selectedBlockId.value = instance.id
    return true
  }

  function detachSymbolInstance(blockId: string): boolean {
    const instance = findBlock(document.value.blocks, blockId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const symbolId = (instance.props as Record<string, unknown>).symbolId
    const symbol = typeof symbolId === 'string' ? activeSymbols()[symbolId] : undefined
    if (!symbol)
      return false

    const materialized = materializeSymbolInstance(instance, symbol).root
    const [plainRoot] = mapBlockTree([materialized], block => block.type === COMPONENT_SLOT_BLOCK_TYPE
      ? { ...block, type: 'div', props: {} }
      : block)
    const detached = cloneBlockWithNewIds(plainRoot ?? materialized)
    const blocks = updateBlockInTree(document.value.blocks, blockId, () => detached)
    commit({ ...document.value, blocks }, 'history.detachComponent')
    selectedBlockId.value = detached.id
    return true
  }

  return { saveBlockAsSymbol, insertSymbolInstance, addSymbolInstance, detachSymbolInstance }
}
