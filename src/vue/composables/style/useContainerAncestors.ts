import type { Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import type { I18n } from '@/vue/i18n'
import { computed } from 'vue'
import { blockStyleValue, findBlock, findBlockParentId } from '@/core'
import { displayBlockLabel } from '@/vue/utils/block-label'

export interface ContainerParent {
  blockId: string
  label: string
}

export interface ContainerAncestor extends ContainerParent {
  name: string
}

interface ResolvedAncestor extends ContainerParent {
  containerType: unknown
  containerName: unknown
}

/** Named query containers among the selected block's ancestors, nearest first. */
export function useContainerAncestors(
  editor: PageEditorInstance,
  block: Ref<PageBlock | undefined>,
  t: I18n['t'],
) {
  const ancestors = computed<ResolvedAncestor[]>(() => {
    const selected = block.value
    if (!selected)
      return []

    const document = editor.effectiveDocument.value
    const result: ResolvedAncestor[] = []
    let parentId = findBlockParentId(document.blocks, selected.id)

    while (parentId) {
      const parent = findBlock(document.blocks, parentId)
      if (!parent)
        break

      result.push({
        blockId: parent.id,
        label: displayBlockLabel(parent, editor.registry.value[parent.type], t),
        containerType: blockStyleValue(parent, document.styles ?? {}, 'containerType'),
        containerName: blockStyleValue(parent, document.styles ?? {}, 'containerName'),
      })
      parentId = findBlockParentId(document.blocks, parent.id)
    }

    return result
  })

  const nearestParent = computed<ContainerParent | undefined>(() => {
    const parent = ancestors.value[0]
    return parent
      ? { blockId: parent.blockId, label: parent.label }
      : undefined
  })

  const containers = computed<ContainerAncestor[]>(() =>
    ancestors.value.flatMap((ancestor) => {
      if (
        ancestor.containerType !== 'inline-size'
        || typeof ancestor.containerName !== 'string'
        || !ancestor.containerName
      ) {
        return []
      }
      return [{
        blockId: ancestor.blockId,
        label: ancestor.label,
        name: ancestor.containerName,
      }]
    }),
  )

  return { containers, nearestParent }
}
