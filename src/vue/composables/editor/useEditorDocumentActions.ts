import type { ShallowRef } from 'vue'
import type { GlobalSettings, PageBlock, PageDocument, SymbolDefinition } from '@/core'
import {
  filterDocumentBlocks,
  findBlock,
  removeBlockFromTree,
  SYMBOL_INSTANCE_BLOCK_TYPE,
} from '@/core'
import {
  cleanSymbolsAfterMasterRemoval,
  collectComponentApiIds,
  removeSlotFills,
} from '@/vue/utils/symbol-editor'

export interface UseEditorDocumentActionsOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  selectedBlockId: ShallowRef<string | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitBoth: (document: PageDocument, globals: GlobalSettings, label?: string) => void
  updateSnapshot: (updater: (snapshot: PageDocument) => PageDocument) => void
}

/** Owns destructive document mutations that affect trees, symbols and selection. */
export function useEditorDocumentActions(options: UseEditorDocumentActionsOptions) {
  const {
    document,
    globals,
    selectedBlockId,
    activeSymbols,
    commit,
    commitBoth,
    updateSnapshot,
  } = options

  function deleteSymbol(symbolId: string): boolean {
    if (!activeSymbols()[symbolId])
      return false
    const symbolsNext = { ...activeSymbols() }
    delete symbolsNext[symbolId]

    const isThisInstance = (block: PageBlock) =>
      block.type === SYMBOL_INSTANCE_BLOCK_TYPE
      && (block.props as Record<string, unknown>).symbolId === symbolId

    // Remove instances from the active page and nested component masters so
    // deleting a master cannot leave a broken reference anywhere in the tree.
    const filtered = filterDocumentBlocks(
      { ...document.value, symbols: symbolsNext },
      block => !isThisInstance(block),
    )

    if (selectedBlockId.value && !findBlock(filtered.blocks, selectedBlockId.value))
      selectedBlockId.value = filtered.blocks[0]?.id ?? null

    if (globals.value)
      commitBoth({ ...document.value, blocks: filtered.blocks }, { ...globals.value, symbols: filtered.symbols })
    else
      commit({ ...document.value, blocks: filtered.blocks, symbols: filtered.symbols })
    return true
  }

  function removeBlock(id: string) {
    const target = findBlock(document.value.blocks, id)
    const blockIds = new Set<string>()
    const slotIds = new Set<string>()
    if (target)
      collectComponentApiIds(target, blockIds, slotIds)

    const nextDocument = {
      ...document.value,
      blocks: removeSlotFills(removeBlockFromTree(document.value.blocks, id), slotIds),
      symbols: cleanSymbolsAfterMasterRemoval(document.value.symbols, blockIds, slotIds),
    }

    updateSnapshot(snapshot => ({
      ...snapshot,
      blocks: removeSlotFills(snapshot.blocks, slotIds),
      symbols: cleanSymbolsAfterMasterRemoval(snapshot.symbols, blockIds, slotIds),
    }))

    if (globals.value) {
      commitBoth(nextDocument, {
        ...globals.value,
        symbols: cleanSymbolsAfterMasterRemoval(globals.value.symbols, blockIds, slotIds),
      }, 'history.deleteBlock')
    }
    else {
      commit(nextDocument, 'history.deleteBlock')
    }

    if (selectedBlockId.value === id)
      selectedBlockId.value = document.value.blocks[0]?.id ?? null
  }

  return { deleteSymbol, removeBlock }
}
