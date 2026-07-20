import type {
  PageBlock,
  SlotBlockProps,
  SymbolDefinition,
  SymbolSlotFillBlockProps,
} from '@/core/types/page-document'
import {
  COMPONENT_SLOT_BLOCK_TYPE,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
} from '@/core/types/page-document'
import { findBlock, findBlockParentId, visitBlockTree } from '@/core/utils/block-tree'
import { getInstanceSymbolId } from '@/core/utils/document-tree'
import { createUniqueName } from '@/core/utils/ids'
import { sanitizeClassName } from '@/core/utils/style-classes'

/** Slots owned directly by this component; nested component instances are opaque. */
export function getSymbolSlots(symbol: SymbolDefinition): Array<PageBlock<SlotBlockProps>> {
  const slots: Array<PageBlock<SlotBlockProps>> = []
  visitBlockTree([symbol.root], (block) => {
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    if (block.type === COMPONENT_SLOT_BLOCK_TYPE) {
      slots.push(block as unknown as PageBlock<SlotBlockProps>)
      // Slot-in-Slot is invalid in v1, so its fallback is not another API scope.
      return false
    }
  })
  return slots
}

/** Produces a stable, unique public Slot name for a component master. */
export function uniqueSymbolSlotName(symbol: SymbolDefinition, preferred = 'content'): string {
  const base = sanitizeClassName(preferred.trim()) || 'content'
  return createUniqueName(base, getSymbolSlots(symbol).map(slot => slot.props.name))
}

export function getInstanceSlotFills(instance: PageBlock): Array<PageBlock<SymbolSlotFillBlockProps>> {
  return (instance.children ?? []).filter(
    block => block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE,
  ) as Array<PageBlock<SymbolSlotFillBlockProps>>
}

export interface SlotFillContext {
  instance: PageBlock
  symbol: SymbolDefinition
  /** The master slot this fill feeds — undefined when the slot was deleted. */
  slot?: PageBlock<SlotBlockProps>
}

/**
 * Resolve a `__symbol_slot_fill` block back to its owning instance, that
 * instance's symbol and the master slot it fills. Every UI surface that names
 * or redirects a fill shares this walk instead of hand-rolling the parent →
 * symbol → slot lookup.
 */
export function resolveSlotFillContext(
  blocks: PageBlock[],
  symbols: Record<string, SymbolDefinition> | undefined,
  fillId: string,
): SlotFillContext | undefined {
  const fill = findBlock(blocks, fillId)
  if (!fill || fill.type !== SYMBOL_SLOT_FILL_BLOCK_TYPE)
    return undefined
  const instanceId = findBlockParentId(blocks, fillId)
  const instance = instanceId ? findBlock(blocks, instanceId) : undefined
  const symbolId = instance ? getInstanceSymbolId(instance) : null
  const symbol = symbolId ? symbols?.[symbolId] : undefined
  if (!instance || !symbol)
    return undefined
  const slotId = (fill.props as SymbolSlotFillBlockProps).slotId
  return {
    instance,
    symbol,
    slot: getSymbolSlots(symbol).find(candidate => candidate.id === slotId),
  }
}
