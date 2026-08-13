import type { ComputedRef } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { displayBlockLabel } from '@/vue/utils/block-label'
import { collectAnchorCandidates } from './anchor-css'

export interface AnchorOption {
  value: string
  label: string
  count: number
}

/** Resolves named anchors visible in the effective document for target picking. */
export function useAnchorCandidates(
  editor: PageEditorInstance,
  selectedBlockId: ComputedRef<string | undefined>,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const candidates = computed<AnchorOption[]>(() => {
    const groups = new Map<string, { labels: string[], count: number }>()
    for (const candidate of collectAnchorCandidates(editor.effectiveDocument.value)) {
      if (candidate.blockId === selectedBlockId.value)
        continue
      const block = editor.registry.value[candidate.blockType]
      const label = displayBlockLabel({
        type: candidate.blockType,
        name: candidate.blockName,
      }, block, t)
      const group = groups.get(candidate.name) ?? { labels: [], count: 0 }
      group.count += 1
      if (!group.labels.includes(label))
        group.labels.push(label)
      groups.set(candidate.name, group)
    }

    return [...groups.entries()]
      .map(([value, group]) => {
        const duplicateLabel = group.count > 1
          ? ` · ${t('cssAnchor.multipleTargets', { count: group.count })}`
          : ''
        return {
          value,
          label: `${group.labels[0] ?? value} · ${value}${duplicateLabel}`,
          count: group.count,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  return { candidates }
}
