import type { ShallowRef } from 'vue'
import type { BlockRegistry, PageBlock, PageDocument } from '@/core'
import { findBlock, updateBlockInTree } from '@/core'

export interface UseEditorDocumentMutationsOptions {
  document: ShallowRef<PageDocument>
  registry: ShallowRef<BlockRegistry>
  readonly?: boolean
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  selectedBlockId: ShallowRef<string | null>
}

/**
 * Owns non-destructive document mutations shared by direct block edits and AI
 * scope application. Destructive tree/symbol cleanup lives in
 * useEditorDocumentActions instead.
 */
export function useEditorDocumentMutations(options: UseEditorDocumentMutationsOptions) {
  const {
    document,
    registry,
    readonly,
    commit,
    selectedBlockId,
  } = options

  function updateBlock(id: string, updater: (block: PageBlock) => PageBlock) {
    // Field-level edit — typing / scrubbing floods this; coalesce the burst.
    commit({
      ...document.value,
      blocks: updateBlockInTree(document.value.blocks, id, updater),
    }, 'history.editBlock', true)
  }

  // Apply AI-generated blocks to a scope as a single, undoable history step.
  // A missing scope replaces the page; a container adopts the generated
  // children; a leaf keeps its identity/type and adopts the first block's
  // editable values.
  function applyAiBlocks(scopeId: string | null, blocks: PageBlock[], label = 'history.aiEdit') {
    if (readonly || !blocks.length)
      return

    const root = scopeId ? findBlock(document.value.blocks, scopeId) : null
    if (!scopeId || !root) {
      commit({ ...document.value, blocks }, label)
      selectedBlockId.value = null
      return
    }

    if (registry.value[root.type]?.acceptsChildren) {
      commit({
        ...document.value,
        blocks: updateBlockInTree(document.value.blocks, scopeId, current => ({ ...current, children: blocks })),
      }, label)
      return
    }

    const next = blocks[0]!
    commit({
      ...document.value,
      blocks: updateBlockInTree(document.value.blocks, scopeId, current => ({
        ...current,
        props: next.props,
        style: next.style,
        classes: next.classes,
      })),
    }, label)
  }

  return { updateBlock, applyAiBlocks }
}
