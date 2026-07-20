import type { ShallowRef } from 'vue'
import type { BlockRegistry, PageBlock, PageDocument } from '@/core'
import {
  cloneBlockWithNewIds,
  COMPONENT_SLOT_BLOCK_TYPE,
  createBlock,
  findBlock,
  findBlockParentId,
  getBlockPath,
  insertBlockInTree,
  moveBlock,
  moveBlockTo,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
  updateBlockInTree,
} from '@/core'

interface InstanceSlotTarget {
  fill?: PageBlock
}

export interface UseEditorBlockActionsOptions {
  document: ShallowRef<PageDocument>
  registry: ShallowRef<BlockRegistry>
  selectedBlockId: ShallowRef<string | null>
  editingSymbolId: ShallowRef<string | null>
  editScopeRootId: ShallowRef<string | null>
  resolveInstanceSlot: (instanceId: string, slotId: string, blocks?: PageBlock[]) => InstanceSlotTarget | undefined
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
}

/** Owns regular block insertion, tree movement and visibility actions. */
export function useEditorBlockActions(options: UseEditorBlockActionsOptions) {
  const {
    document,
    registry,
    selectedBlockId,
    editingSymbolId,
    editScopeRootId,
    resolveInstanceSlot,
    commit,
  } = options

  function canInsertDefinition(type: string): boolean {
    const definition = registry.value[type]
    return !!definition && definition.availability !== 'component'
  }

  function resolveDefaultParentId(): string | null {
    const selectedId = selectedBlockId.value
    if (!selectedId)
      return null

    const block = findBlock(document.value.blocks, selectedId)
    if (!block)
      return null

    if (block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE) {
      const parentId = findBlockParentId(document.value.blocks, block.id)
      const slotId = (block.props as Record<string, unknown>).slotId
      if (typeof parentId === 'string' && typeof slotId === 'string') {
        const target = resolveInstanceSlot(parentId, slotId)
        if (target?.fill?.id === block.id)
          return block.id
      }
      return null
    }

    return registry.value[block.type]?.acceptsChildren ? block.id : null
  }

  function resolveDefaultInsertion(): { parentId: string | null, index?: number } {
    const parentId = resolveDefaultParentId()
    if (parentId)
      return { parentId }
    const selectedId = selectedBlockId.value
    const selected = selectedId ? findBlock(document.value.blocks, selectedId) : null
    if (!selected || selected.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return { parentId: null }
    const siblingParentId = findBlockParentId(document.value.blocks, selected.id) ?? null
    const siblings = siblingParentId === null
      ? document.value.blocks
      : findBlock(document.value.blocks, siblingParentId)?.children ?? []
    const index = siblings.findIndex(candidate => candidate.id === selected.id)
    return index >= 0 ? { parentId: siblingParentId, index: index + 1 } : { parentId: null }
  }

  function spliceBlockInto(block: PageBlock, parentId: string | null, index: number | undefined, label: string) {
    commit({
      ...document.value,
      blocks: insertBlockInTree(document.value.blocks, parentId, index ?? Number.MAX_SAFE_INTEGER, block),
    }, label)
  }

  function addBlock(type: string, parentId?: string | null) {
    const definition = registry.value[type]
    if (!definition || !canInsertDefinition(type))
      return false
    const block = createBlock(definition)
    const target = parentId === undefined ? resolveDefaultInsertion() : { parentId, index: undefined }
    spliceBlockInto(block, target.parentId, target.index, 'history.addBlock')
    selectedBlockId.value = block.id
    return true
  }

  function insertBlock(type: string, parentId: string | null, index: number) {
    const definition = registry.value[type]
    if (!definition || !canInsertDefinition(type))
      return false
    const block = createBlock(definition)
    const next = insertBlockInTree(document.value.blocks, parentId, index, block)
    commit({ ...document.value, blocks: next }, 'history.addBlock')
    selectedBlockId.value = block.id
    return true
  }

  function duplicateBlock(id: string) {
    const original = findBlock(document.value.blocks, id)
    if (!original || original.type === SYMBOL_SLOT_FILL_BLOCK_TYPE || original.type === COMPONENT_SLOT_BLOCK_TYPE)
      return false
    const clone = cloneBlockWithNewIds(original)
    const parentId = findBlockParentId(document.value.blocks, id) ?? null
    const siblings = parentId === null
      ? document.value.blocks
      : findBlock(document.value.blocks, parentId)?.children ?? []
    const at = siblings.findIndex(block => block.id === id) + 1
    const next = insertBlockInTree(document.value.blocks, parentId, at, clone)
    commit({ ...document.value, blocks: next }, 'history.duplicate')
    selectedBlockId.value = clone.id
    return true
  }

  function wrapBlock(id: string): boolean {
    const definition = registry.value.div
    if (!definition)
      return false
    const target = findBlock(document.value.blocks, id)
    if (!target || target.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return false
    const wrapper: PageBlock = { ...createBlock(definition), children: [target] }
    const parentId = findBlockParentId(document.value.blocks, id) ?? null
    const replaceInList = (list: PageBlock[]) => list.map(block => (block.id === id ? wrapper : block))
    const next = parentId === null
      ? replaceInList(document.value.blocks)
      : updateBlockInTree(document.value.blocks, parentId, current => ({
          ...current,
          children: replaceInList(current.children ?? []),
        }))
    commit({ ...document.value, blocks: next }, 'history.wrap')
    selectedBlockId.value = wrapper.id
    return true
  }

  function unwrapBlock(id: string): boolean {
    const target = findBlock(document.value.blocks, id)
    if (!target?.children?.length || target.type === SYMBOL_SLOT_FILL_BLOCK_TYPE || target.type === COMPONENT_SLOT_BLOCK_TYPE)
      return false
    const children = target.children
    const parentId = findBlockParentId(document.value.blocks, id) ?? null
    const replaceInList = (list: PageBlock[]) => list.flatMap(block => (block.id === id ? children : [block]))
    const next = parentId === null
      ? replaceInList(document.value.blocks)
      : updateBlockInTree(document.value.blocks, parentId, current => ({
          ...current,
          children: replaceInList(current.children ?? []),
        }))
    commit({ ...document.value, blocks: next }, 'history.removeWrapper')
    selectedBlockId.value = children[0]!.id
    return true
  }

  function setBlockHidden(id: string, hidden: boolean): boolean {
    if (!findBlock(document.value.blocks, id))
      return false
    const next = updateBlockInTree(document.value.blocks, id, (current) => {
      const out = { ...current }
      if (hidden)
        out.hidden = true
      else
        delete out.hidden
      return out
    })
    commit({ ...document.value, blocks: next }, hidden ? 'history.hide' : 'history.show')
    return true
  }

  function moveSelectedBlock(direction: -1 | 1) {
    if (!selectedBlockId.value)
      return
    commit({
      ...document.value,
      blocks: moveBlock(document.value.blocks, selectedBlockId.value, direction),
    }, 'history.moveBlock')
  }

  function moveBlockToPosition(sourceId: string, targetParentId: string | null, targetIndex: number) {
    const source = findBlock(document.value.blocks, sourceId)
    if (source?.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return false
    if (source?.type === COMPONENT_SLOT_BLOCK_TYPE) {
      if (!editingSymbolId.value || !targetParentId)
        return false
      const targetPath = getBlockPath(document.value.blocks, targetParentId)
      if (targetPath.some(block =>
        block.type === COMPONENT_SLOT_BLOCK_TYPE
        || block.type === SYMBOL_INSTANCE_BLOCK_TYPE
        || block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE,
      )) {
        return false
      }
      const scopeRootId = editScopeRootId.value ?? document.value.blocks[0]?.id
      const scopeRoot = scopeRootId ? findBlock(document.value.blocks, scopeRootId) : undefined
      if (!scopeRoot || (targetParentId !== scopeRootId && !getBlockPath([scopeRoot], targetParentId).length))
        return false
    }
    const next = moveBlockTo(document.value.blocks, sourceId, targetParentId, targetIndex)
    if (next === document.value.blocks)
      return false
    commit({ ...document.value, blocks: next }, 'history.moveBlock')
    return true
  }

  return {
    addBlock,
    insertBlock,
    duplicateBlock,
    wrapBlock,
    unwrapBlock,
    setBlockHidden,
    resolveDefaultInsertion,
    spliceBlockInto,
    moveSelectedBlock,
    moveBlockToPosition,
  }
}
