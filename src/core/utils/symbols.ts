import type {
  PageBlock,
  SymbolDefinition,
  SymbolInstanceBlockProps,
  SymbolPropertyDefinition,
  SymbolSlotFillBlockProps,
} from '@/core/types/page-document'
import {
  COMPONENT_SLOT_BLOCK_TYPE,
} from '@/core/types/page-document'
import { findBlock, mapBlockTree, visitBlockTree } from '@/core/utils/block-tree'
import {
  applyVariantToRoot,
  getInstanceSymbolId,
  getInstanceVariantId,
  resolveActiveVariant,
} from '@/core/utils/document-tree'
import { isRecord } from '@/core/utils/records'
import {
  getInstanceSlotFills,
  getSymbolSlots,
} from '@/core/utils/symbol-slots'

export type SymbolDiagnosticCode
  = | 'missing-property-target'
    | 'orphan-slot-fill'
    | 'duplicate-slot-fill'

export interface SymbolDiagnostic {
  code: SymbolDiagnosticCode
  message: string
  symbolId: string
  propertyId?: string
  blockId?: string
}

export interface MaterializeSymbolInstanceOptions {
  /**
   * Values resolved by the caller (for example CMS bindings). They take
   * precedence over the authored values persisted on the instance.
   */
  propertyValues?: Record<string, unknown>
}

export interface ResolvedSymbolInstance {
  root: PageBlock
  diagnostics: SymbolDiagnostic[]
  instanceOwnedBlockIds: ReadonlySet<string>
  slots: ResolvedInstanceSlot[]
}

export interface ResolvedInstanceSlot {
  slotId: string
  name: string
  state: 'fallback' | 'custom' | 'empty'
  fillId?: string
}

export function getInstancePropertyValues(block: PageBlock): Record<string, unknown> {
  const value = (block.props as SymbolInstanceBlockProps).propertyValues
  return isRecord(value) ? value : {}
}

export function getSymbolPropertyDefault(
  symbol: SymbolDefinition,
  property: SymbolPropertyDefinition,
): unknown {
  let value: unknown
  visitBlockTree([symbol.root], (block) => {
    if (block.id === property.target.blockId)
      value = (block.props as Record<string, unknown>)[property.target.prop]
  })
  return value
}

/** Whether a component master directly or transitively instantiates another. */
export function symbolDependsOn(
  symbols: Record<string, SymbolDefinition> | undefined,
  symbolId: string,
  targetSymbolId: string,
  seen = new Set<string>(),
): boolean {
  if (symbolId === targetSymbolId)
    return true
  if (seen.has(symbolId))
    return false
  seen.add(symbolId)

  const symbol = symbols?.[symbolId]
  if (!symbol)
    return false

  let depends = false
  visitBlockTree([symbol.root], (block) => {
    if (depends)
      return false
    const nestedSymbolId = getInstanceSymbolId(block)
    if (nestedSymbolId && symbolDependsOn(symbols, nestedSymbolId, targetSymbolId, seen))
      depends = true
    return depends ? false : undefined
  })
  return depends
}

/** Whether inserting a block into a component would introduce a symbol cycle. */
export function blockWouldCreateSymbolCycle(
  block: PageBlock,
  targetSymbolId: string,
  symbols: Record<string, SymbolDefinition> | undefined,
): boolean {
  let createsCycle = false
  visitBlockTree([block], (current) => {
    if (createsCycle)
      return false
    const symbolId = getInstanceSymbolId(current)
    if (symbolId && symbolDependsOn(symbols, symbolId, targetSymbolId))
      createsCycle = true
    return createsCycle ? false : undefined
  })
  return createsCycle
}

function collectBlockIds(blocks: PageBlock[], out: Set<string>): void {
  visitBlockTree(blocks, (block) => {
    out.add(block.id)
  })
}

/**
 * Produce the block tree rendered for one component instance. The function is
 * deliberately framework-neutral and immutable so Canvas, HTML and hydrated
 * Vue renderers all share exactly the same component semantics.
 */
export function materializeSymbolInstance(
  instance: PageBlock,
  symbol: SymbolDefinition,
  options: MaterializeSymbolInstanceOptions = {},
): ResolvedSymbolInstance {
  const variant = resolveActiveVariant(symbol, getInstanceVariantId(instance))
  const variantRoot = applyVariantToRoot(symbol, variant)
  const properties = symbol.properties ?? []
  const values = {
    ...getInstancePropertyValues(instance),
    ...options.propertyValues,
  }
  const diagnostics: SymbolDiagnostic[] = []
  const byBlock = new Map<string, SymbolPropertyDefinition[]>()
  for (const property of properties) {
    if (!findBlock([variantRoot], property.target.blockId)) {
      diagnostics.push({
        code: 'missing-property-target',
        message: `Component property "${property.key}" targets missing block "${property.target.blockId}"`,
        symbolId: symbol.id,
        propertyId: property.id,
        blockId: property.target.blockId,
      })
      continue
    }
    if (!Object.hasOwn(values, property.id))
      continue
    const list = byBlock.get(property.target.blockId)
    if (list)
      list.push(property)
    else
      byBlock.set(property.target.blockId, [property])
  }

  let resolvedRoot = variantRoot
  if (byBlock.size) {
    const [propertyRoot] = mapBlockTree([variantRoot], (block) => {
      const targets = byBlock.get(block.id)
      if (!targets?.length)
        return block

      const nextProps = { ...(block.props as Record<string, unknown>) }
      for (const property of targets) {
        nextProps[property.target.prop] = values[property.id]
      }
      return { ...block, props: nextProps }
    })
    resolvedRoot = propertyRoot ?? variantRoot
  }

  const slots = getSymbolSlots({ ...symbol, root: resolvedRoot })
  const slotIds = new Set(slots.map(slot => slot.id))
  const fillsBySlot = new Map<string, PageBlock<SymbolSlotFillBlockProps>>()
  for (const fill of getInstanceSlotFills(instance)) {
    const slotId = fill.props.slotId
    if (!slotIds.has(slotId)) {
      diagnostics.push({
        code: 'orphan-slot-fill',
        message: `Component instance contains a fill for missing slot "${slotId}"`,
        symbolId: symbol.id,
        blockId: fill.id,
      })
      continue
    }
    if (fillsBySlot.has(slotId)) {
      diagnostics.push({
        code: 'duplicate-slot-fill',
        message: `Component instance contains multiple fills for slot "${slotId}"`,
        symbolId: symbol.id,
        blockId: fill.id,
      })
      continue
    }
    fillsBySlot.set(slotId, fill)
  }

  const instanceOwnedBlockIds = new Set<string>()
  const resolvedSlots: ResolvedInstanceSlot[] = slots.map((slot) => {
    const fill = fillsBySlot.get(slot.id)
    if (!fill)
      return { slotId: slot.id, name: slot.props.name, state: 'fallback' }
    const children = fill.children ?? []
    collectBlockIds(children, instanceOwnedBlockIds)
    return {
      slotId: slot.id,
      name: slot.props.name,
      state: children.length ? 'custom' : 'empty',
      fillId: fill.id,
    }
  })

  if (fillsBySlot.size) {
    const [slotRoot] = mapBlockTree([resolvedRoot], (block) => {
      if (block.type !== COMPONENT_SLOT_BLOCK_TYPE)
        return block
      const fill = fillsBySlot.get(block.id)
      return fill ? { ...block, children: fill.children ? [...fill.children] : [] } : block
    })
    resolvedRoot = slotRoot ?? resolvedRoot
  }

  return {
    root: resolvedRoot,
    diagnostics,
    instanceOwnedBlockIds,
    slots: resolvedSlots,
  }
}
