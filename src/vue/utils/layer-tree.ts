import type {
  PageBlock,
  SymbolDefinition,
} from '@/core/types/page-document'
import {
  SYMBOL_INSTANCE_BLOCK_TYPE,
  SYMBOL_SLOT_FILL_BLOCK_TYPE,
} from '@/core/types/page-document'
import { getInstanceSymbolId } from '@/core/utils/document-tree'
import { getInstanceSlotFills, getSymbolSlots } from '@/core/utils/symbol-slots'

interface LayerTreeRowBase {
  /** Stable key used by virtual lists, collapse state and tree navigation. */
  key: string
  depth: number
  hasChildren: boolean
  expanded: boolean
  /** Key of the projected parent. Internal slot-fill wrappers never appear here. */
  parentKey: string | null
  /** Projected ancestors ordered from the root to the direct parent. */
  ancestorKeys: string[]
}

export interface BlockLayerRow extends LayerTreeRowBase {
  kind: 'block'
  block: PageBlock
}

export interface VirtualSlotLayerRow extends LayerTreeRowBase {
  kind: 'slot'
  instanceId: string
  symbolId: string
  slotId: string
  fillId?: string
  name: string
}

export type LayerTreeRow = BlockLayerRow | VirtualSlotLayerRow

export interface ProjectLayerTreeOptions {
  /** Returns whether a row reveals its projected children. Defaults to true. */
  isExpanded?: (key: string) => boolean
}

/**
 * Slot ids are local to a component master, so a Layers row needs the owning
 * instance id as part of its identity. Encoding makes the key unambiguous even
 * for imported documents whose ids contain punctuation.
 */
export function symbolSlotLayerKey(instanceId: string, slotId: string): string {
  return `symbol-slot:${encodeURIComponent(instanceId)}:${encodeURIComponent(slotId)}`
}

export function isVirtualSlotLayerRow(row: LayerTreeRow): row is VirtualSlotLayerRow {
  return row.kind === 'slot'
}

/**
 * Project authored blocks into the flat tree displayed by Layers.
 *
 * Component instances are opaque except for their public named slots. Each
 * master slot becomes a virtual row below the instance. A custom fill's
 * children are projected below that row, while the persisted
 * `__symbol_slot_fill` transport block itself remains invisible.
 */
export function projectLayerTree(
  blocks: PageBlock[],
  symbols: Record<string, SymbolDefinition> | undefined,
  options: ProjectLayerTreeOptions = {},
): LayerTreeRow[] {
  const isExpanded = options.isExpanded ?? (() => true)
  const rows: LayerTreeRow[] = []

  function visitBlocks(
    list: PageBlock[],
    depth: number,
    parentKey: string | null,
    ancestorKeys: string[],
  ): void {
    for (const block of list) {
      // Be defensive around malformed/imported documents: the fill wrapper is
      // a persistence detail everywhere, not a row users should ever operate.
      if (block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE) {
        visitBlocks(block.children ?? [], depth, parentKey, ancestorKeys)
        continue
      }

      const symbolId = getInstanceSymbolId(block)
      const symbol = symbolId ? symbols?.[symbolId] : undefined
      const slots = symbol ? getSymbolSlots(symbol) : []
      const ordinaryChildren = (block.children ?? []).filter(
        child => child.type !== SYMBOL_SLOT_FILL_BLOCK_TYPE,
      )
      const hasChildren = ordinaryChildren.length > 0 || slots.length > 0
      const expanded = hasChildren && isExpanded(block.id)
      rows.push({
        kind: 'block',
        key: block.id,
        block,
        depth,
        hasChildren,
        expanded,
        parentKey,
        ancestorKeys: [...ancestorKeys],
      })

      if (!expanded)
        continue

      const childAncestors = [...ancestorKeys, block.id]
      if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE && symbol && symbolId) {
        visitInstanceSlots(block, symbol, symbolId, depth + 1, childAncestors)
      }
      visitBlocks(ordinaryChildren, depth + 1, block.id, childAncestors)
    }
  }

  function visitInstanceSlots(
    instance: PageBlock,
    symbol: SymbolDefinition,
    symbolId: string,
    depth: number,
    ancestorKeys: string[],
  ): void {
    const fills = getInstanceSlotFills(instance)
    const firstFillBySlot = new Map<string, (typeof fills)[number]>()
    for (const fill of fills) {
      if (!firstFillBySlot.has(fill.props.slotId))
        firstFillBySlot.set(fill.props.slotId, fill)
    }

    for (const slot of getSymbolSlots(symbol)) {
      const fill = firstFillBySlot.get(slot.id)
      const children = fill?.children ?? []
      const key = symbolSlotLayerKey(instance.id, slot.id)
      const hasChildren = children.length > 0
      const expanded = hasChildren && isExpanded(key)
      rows.push({
        kind: 'slot',
        key,
        instanceId: instance.id,
        symbolId,
        slotId: slot.id,
        ...(fill ? { fillId: fill.id } : {}),
        name: slot.props.name,
        depth,
        hasChildren,
        expanded,
        parentKey: instance.id,
        ancestorKeys: [...ancestorKeys],
      })

      if (expanded)
        visitBlocks(children, depth + 1, key, [...ancestorKeys, key])
    }
  }

  visitBlocks(blocks, 0, null, [])
  return rows
}
