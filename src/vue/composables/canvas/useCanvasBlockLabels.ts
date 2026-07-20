import type { Ref } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Component as ComponentIcon, PanelsTopLeft } from '@lucide/vue'
import { computed } from 'vue'
import { findBlock, getInstanceSymbolId, resolveSlotFillContext, SYMBOL_INSTANCE_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import { displayBlockLabel } from '@/vue/utils/block-label'

/**
 * Resolves the label + icon shown in the selection / hover badges.
 *
 * - Plain blocks: label = localized registry/catalog label, icon = registry icon.
 * - Symbol instances: label = the symbol's display name (or "Missing
 *   component" if the symbol is gone), icon = the violet Component glyph.
 * - Slot fills: label = the Slot's name from the owning symbol — the raw
 *   `__symbol_slot_fill` type must never leak into the UI.
 */
export function useCanvasBlockLabels(editor: PageEditorInstance) {
  const { t } = useUframeI18n()

  function resolveLabel(id: string | null): string | null {
    if (!id)
      return null
    const doc = editor.effectiveDocument.value
    const block = findBlock(doc.blocks, id)
    if (!block)
      return null
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
      const symbolId = getInstanceSymbolId(block)
      const symbol = symbolId ? doc.symbols?.[symbolId] : undefined
      return symbol?.name ?? t('layers.missingComponent')
    }
    if (block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return resolveSlotFillContext(doc.blocks, doc.symbols, block.id)?.slot?.props.name ?? t('layers.slot')
    return displayBlockLabel(block, editor.registry.value[block.type], t)
  }

  function resolveIcon(id: string | null) {
    if (!id)
      return null
    const block = findBlock(editor.document.value.blocks, id)
    if (!block)
      return null
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE)
      return ComponentIcon
    if (block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return PanelsTopLeft
    return editor.registry.value[block.type]?.icon ?? null
  }

  function selectionForId(id: Ref<string | null>) {
    return {
      label: computed(() => resolveLabel(id.value)),
      icon: computed(() => resolveIcon(id.value)),
    }
  }

  return { resolveLabel, resolveIcon, selectionForId }
}
