import type { Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { blockStyleValue, findBlock, findBlockParentId } from '@/core'

/** Derives whether the selected style target is an item inside a grid or flex parent. */
export function useBlockParentLayout(editor: PageEditorInstance, block: Ref<PageBlock | undefined>) {
  const parentDisplay = computed(() => {
    if (!block.value)
      return undefined
    // The inspector edits a resolved page (symbols, applied classes), so use
    // the same tree and style catalog as the canvas when checking its parent.
    const document = editor.effectiveDocument.value
    const blocks = document.blocks
    const parentId = findBlockParentId(blocks, block.value.id)
    const parent = parentId ? findBlock(blocks, parentId) : undefined
    return parent
      ? blockStyleValue(parent, document.styles ?? {}, 'display')
      : document.settings.style?.display
  })
  const parentIsGrid = computed(() => parentDisplay.value === 'grid')
  const parentIsFlex = computed(() => parentDisplay.value === 'flex' || parentDisplay.value === 'inline-flex')
  return { parentIsGrid, parentIsFlex }
}
