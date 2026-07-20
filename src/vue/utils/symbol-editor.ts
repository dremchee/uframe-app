import type { PageBlock, SymbolDefinition, SymbolPropertyControl } from '@/core'
import { COMPONENT_SLOT_BLOCK_TYPE, createShortId, createUniqueName, mapBlockTree, SYMBOL_INSTANCE_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core'

export function makeEditorNodeId(prefix: string): string {
  return createShortId(prefix)
}

export function makeSymbolPropertyId(): string {
  return makeEditorNodeId('prop')
}

export function humanizePropertyKey(key: string): string {
  if (key === 'url')
    return 'URL'
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, character => character.toUpperCase())
    .trim()
}

export function inferPublicPropertyKey(prop: string): string {
  if (/^(?:label|text|content)$/i.test(prop))
    return 'text'
  if (/^(?:href|src|url)$/i.test(prop))
    return 'url'
  return prop
    .replace(/[^\w$-]/g, '-')
    .replace(/-(\w)/g, (_, character: string) => character.toUpperCase())
    .replace(/^[^a-z_$]+/i, '') || 'property'
}

export function inferSymbolPropertyControl(prop: string, value: unknown): SymbolPropertyControl {
  if (typeof value === 'boolean')
    return { type: 'boolean' }
  if (typeof value === 'number')
    return { type: 'number' }
  if (/(?:color|colour|fill|stroke)$/i.test(prop))
    return { type: 'color' }
  if (/^(?:href|src|url)$/i.test(prop) || /(?:url|link)$/i.test(prop))
    return { type: 'url' }
  if (/^(?:html|description|body)$/i.test(prop) || (typeof value === 'string' && value.length > 120))
    return { type: 'textarea' }
  return { type: 'text' }
}

export function removeSlotFills(blocks: PageBlock[], slotIds: ReadonlySet<string>): PageBlock[] {
  if (!slotIds.size)
    return blocks
  return mapBlockTree(blocks, (block) => {
    if (block.type !== SYMBOL_INSTANCE_BLOCK_TYPE || !block.children?.length)
      return block
    const children = block.children.filter((child) => {
      if (child.type !== SYMBOL_SLOT_FILL_BLOCK_TYPE)
        return true
      const slotId = (child.props as Record<string, unknown>).slotId
      return typeof slotId !== 'string' || !slotIds.has(slotId)
    })
    return children.length === block.children.length ? block : { ...block, children }
  })
}

/** Collects master block and Slot ids before removing a component subtree. */
export function collectComponentApiIds(block: PageBlock, blockIds: Set<string>, slotIds: Set<string>): void {
  blockIds.add(block.id)
  if (block.type === COMPONENT_SLOT_BLOCK_TYPE)
    slotIds.add(block.id)
  for (const child of block.children ?? [])
    collectComponentApiIds(child, blockIds, slotIds)
}

/** Drops public properties and instance Slot fills that target removed master nodes. */
export function cleanSymbolsAfterMasterRemoval(
  symbols: Record<string, SymbolDefinition> | undefined,
  blockIds: ReadonlySet<string>,
  slotIds: ReadonlySet<string>,
): Record<string, SymbolDefinition> | undefined {
  if (!symbols)
    return symbols
  return Object.fromEntries(Object.entries(symbols).map(([id, symbol]) => {
    const [root] = removeSlotFills([symbol.root], slotIds)
    const properties = (symbol.properties ?? []).filter(property => !blockIds.has(property.target.blockId))
    const next: SymbolDefinition = { ...symbol, root: root ?? symbol.root }
    if (properties.length)
      next.properties = properties
    else
      delete next.properties
    return [id, next]
  }))
}

export function uniqueSymbolPropertyKey(symbol: SymbolDefinition, preferred: string): string {
  return createUniqueName(preferred, (symbol.properties ?? []).map(property => property.key), '')
}
