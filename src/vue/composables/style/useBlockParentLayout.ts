import type { Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { EditingTarget } from '@/vue/composables/style/useBlockClasses'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { findBlock, findBlockParentId } from '@/core'

/** Derives whether the selected style target is an item inside a grid or flex parent. */
export function useBlockParentLayout(editor: PageEditorInstance, block: Ref<PageBlock | undefined>, editingTarget: Ref<EditingTarget>) {
  const parentDisplay = computed(() => {
    if (editingTarget.value.kind !== 'block' || !block.value)
      return undefined
    const blocks = editor.document.value.blocks
    const parentId = findBlockParentId(blocks, block.value.id)
    return parentId ? findBlock(blocks, parentId)?.style?.display : editor.document.value.settings.style?.display
  })
  const parentIsGrid = computed(() => parentDisplay.value === 'grid')
  const parentIsFlex = computed(() => parentDisplay.value === 'flex' || parentDisplay.value === 'inline-flex')
  return { parentIsGrid, parentIsFlex }
}
