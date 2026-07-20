import type { ShallowRef } from 'vue'
import type { GlobalSettings, PageDocument, SymbolDefinition } from '@/core'
import { shallowRef, watch } from 'vue'
import {
  findBlock,
  getInstanceSymbolId,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  updateBlockInTree,
} from '@/core'

export interface UseEditorSymbolMasterOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  commitSymbols: (symbols: Record<string, SymbolDefinition> | undefined, label?: string) => void
  resetHistory: (document: PageDocument, globals: GlobalSettings | null) => unknown
  selectedBlockId: ShallowRef<string | null>
  selectBlock: (id: string | null) => void
  requestRevealInTree: (id: string | null) => void
}

/** Owns the isolated/in-place component master editing session lifecycle. */
export function useEditorSymbolMaster(options: UseEditorSymbolMasterOptions) {
  const {
    document,
    globals,
    activeSymbols,
    commitSymbols,
    resetHistory,
    selectedBlockId,
    selectBlock,
    requestRevealInTree,
  } = options

  const editingSymbolId = shallowRef<string | null>(null)
  const editScopeRootId = shallowRef<string | null>(null)
  const pageDocumentSnapshot = shallowRef<PageDocument | null>(null)

  function enterSymbolEdit(symbolId: string, anchorInstanceId?: string): boolean {
    if (editingSymbolId.value)
      return false
    const symbol = activeSymbols()[symbolId]
    if (!symbol)
      return false
    pageDocumentSnapshot.value = document.value

    // In-place: splice the symbol root into the page tree where the instance
    // sits, so every existing tree mutation keeps operating on one tree.
    // Without an anchor, use isolated full-canvas mode for detached masters.
    const inPlace = !!anchorInstanceId && !!findBlock(document.value.blocks, anchorInstanceId)
    const blocks = inPlace
      ? updateBlockInTree(document.value.blocks, anchorInstanceId!, () => symbol.root)
      : [symbol.root]
    editScopeRootId.value = inPlace ? symbol.root.id : null

    document.value = {
      ...document.value,
      blocks,
      updatedAt: new Date().toISOString(),
    }
    editingSymbolId.value = symbolId
    selectedBlockId.value = symbol.root.id
    resetHistory(document.value, globals.value)
    return true
  }

  function enterInstanceMasterEdit(instanceId: string): boolean {
    const instance = findBlock(document.value.blocks, instanceId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const symbolId = getInstanceSymbolId(instance)
    return symbolId ? enterSymbolEdit(symbolId, instanceId) : false
  }

  function editInstanceSlotElement(instanceId: string, slotId: string): boolean {
    const instance = findBlock(document.value.blocks, instanceId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const symbolId = getInstanceSymbolId(instance)
    if (!symbolId)
      return false
    if (editingSymbolId.value !== symbolId && !enterSymbolEdit(symbolId, instanceId))
      return false
    selectBlock(slotId)
    requestRevealInTree(slotId)
    return true
  }

  function exitSymbolEdit(): boolean {
    const symbolId = editingSymbolId.value
    if (!symbolId)
      return false

    const restored = pageDocumentSnapshot.value
    const editedRoot = editScopeRootId.value
      ? findBlock(document.value.blocks, editScopeRootId.value)
      : document.value.blocks[0]

    // Shared context keeps symbol metadata in globals while the page tree is
    // restored from the snapshot. Single-document mode merges global metadata
    // edits back into the restored document before replacing the root.
    if (globals.value) {
      const symbol = activeSymbols()[symbolId]
      if (restored && symbol && editedRoot) {
        const now = new Date().toISOString()
        globals.value = {
          ...globals.value,
          symbols: { ...globals.value.symbols, [symbolId]: { ...symbol, root: editedRoot, updatedAt: now } },
          updatedAt: now,
        }
        document.value = restored
      }
      else if (restored) {
        document.value = restored
      }
    }
    else {
      const symbol = restored?.symbols?.[symbolId]
      if (restored && symbol && editedRoot) {
        document.value = {
          ...restored,
          styles: document.value.styles,
          symbols: {
            ...document.value.symbols,
            [symbolId]: { ...symbol, root: editedRoot, updatedAt: new Date().toISOString() },
          },
          updatedAt: new Date().toISOString(),
        }
      }
      else if (restored) {
        document.value = restored
      }
    }

    pageDocumentSnapshot.value = null
    editingSymbolId.value = null
    editScopeRootId.value = null
    resetHistory(document.value, globals.value)
    selectedBlockId.value = null
    return true
  }

  /** Keep metadata changes made during a single-document master edit on exit. */
  function updateSymbol(symbolId: string, updater: (symbol: SymbolDefinition) => SymbolDefinition): boolean {
    const current = activeSymbols()[symbolId]
    if (!current)
      return false
    const next = { ...updater(current), updatedAt: new Date().toISOString() }
    commitSymbols({ ...activeSymbols(), [symbolId]: next })
    if (!globals.value && editingSymbolId.value === symbolId && pageDocumentSnapshot.value) {
      pageDocumentSnapshot.value = {
        ...pageDocumentSnapshot.value,
        symbols: { ...pageDocumentSnapshot.value.symbols, [symbolId]: next },
      }
    }
    return true
  }

  /** Apply master-snapshot cleanup when a block is deleted during editing. */
  function updateSnapshot(updater: (snapshot: PageDocument) => PageDocument) {
    if (pageDocumentSnapshot.value)
      pageDocumentSnapshot.value = updater(pageDocumentSnapshot.value)
  }

  // Safety invariant: the in-place root must remain in the active tree. If an
  // operation removes it, finalize the session instead of leaving stale scope.
  watch(document, (current) => {
    if (editingSymbolId.value && editScopeRootId.value && !findBlock(current.blocks, editScopeRootId.value))
      exitSymbolEdit()
  })

  return {
    editingSymbolId,
    editScopeRootId,
    enterSymbolEdit,
    enterInstanceMasterEdit,
    editInstanceSlotElement,
    exitSymbolEdit,
    updateSymbol,
    updateSnapshot,
  }
}
