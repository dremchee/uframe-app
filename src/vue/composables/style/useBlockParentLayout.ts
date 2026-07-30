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
    const blocks = editor.document.value.blocks
    const parentId = findBlockParentId(blocks, block.value.id)
    const parent = parentId ? findBlock(blocks, parentId) : undefined
    return parent
      ? blockStyleValue(parent, editor.document.value.styles ?? {}, 'display')
      : editor.document.value.settings.style?.display
  })
  const parentIsGrid = computed(() => parentDisplay.value === 'grid')
  const parentIsFlex = computed(() => parentDisplay.value === 'flex' || parentDisplay.value === 'inline-flex')
  return { parentIsGrid, parentIsFlex }
}
