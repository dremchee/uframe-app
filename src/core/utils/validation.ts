import type { BlockRegistry } from '@/core/types/block-registry'
import type { PageBlock, PageDocument } from '@/core/types/page-document'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'
import { COMPONENT_SLOT_BLOCK_TYPE, SYMBOL_INSTANCE_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core/types/page-document'
import { findBlock, visitBlockTree } from '@/core/utils/block-tree'
import { isRecord } from '@/core/utils/records'
import { getInstanceSlotFills, getSymbolSlots } from '@/core/utils/symbol-slots'

export interface ValidationResult {
  success: boolean
  errors: string[]
}

export function formatValidationErrors(error: unknown): string[] {
  const issues = isRecord(error) && Array.isArray(error.issues) ? error.issues : null
  if (!issues)
    return ['Unknown validation error']

  return issues.map((issue) => {
    if (!isRecord(issue) || !Array.isArray(issue.path) || typeof issue.message !== 'string')
      return 'Unknown validation error'
    return `${issue.path.join('.') || 'document'}: ${issue.message}`
  })
}

// Standard Schema issue paths may contain object segments (`{ key }`) — flatten
// to a dotted string. Empty path → the props root.
function formatStandardIssues(
  issues: ReadonlyArray<{ message: string, path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> }>,
): string[] {
  return issues.map((issue) => {
    const path = (issue.path ?? [])
      .map(segment => (typeof segment === 'object' ? segment.key : segment))
      .join('.')
    return `${path || 'props'}: ${issue.message}`
  })
}

export function validatePageDocument(document: unknown): ValidationResult {
  const result = pageDocumentSchema.safeParse(document)

  return result.success
    ? { success: true, errors: [] }
    : { success: false, errors: formatValidationErrors(result.error) }
}

export function validateBlockProps(
  block: Pick<PageBlock, 'type' | 'props'>,
  registry: BlockRegistry,
): ValidationResult {
  const definition = registry[block.type]

  if (!definition) {
    return {
      success: false,
      errors: [`Unknown block type "${block.type}"`],
    }
  }

  // No schema → no prop validation (schema is optional under the neutral contract).
  const schema = definition.propsSchema
  if (!schema)
    return { success: true, errors: [] }

  const result = schema['~standard'].validate(block.props)

  // Sync-only: async Standard Schemas would require an async validation chain.
  if (result instanceof Promise) {
    return { success: false, errors: [`Block "${block.type}": async prop schemas are not supported`] }
  }

  return result.issues
    ? { success: false, errors: formatStandardIssues(result.issues) }
    : { success: true, errors: [] }
}

export function validateDocumentBlocks(document: PageDocument, registry: BlockRegistry): ValidationResult {
  const errors: string[] = []
  const roots = [
    ...document.blocks,
    ...Object.values(document.symbols ?? {}).map(symbol => symbol.root),
  ]
  visitBlockTree(roots, (block) => {
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE || block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
      return
    const result = validateBlockProps(block, registry)
    errors.push(...result.errors.map(error => `${block.id}: ${error}`))
  })

  return {
    success: errors.length === 0,
    errors,
  }
}

/** Cross-reference validation that needs both the component master and registry. */
export function validateSymbolProperties(document: PageDocument, registry: BlockRegistry): ValidationResult {
  const errors: string[] = []

  for (const symbol of Object.values(document.symbols ?? {})) {
    const ids = new Set<string>()
    const keys = new Set<string>()
    const targets = new Set<string>()
    for (const property of symbol.properties ?? []) {
      if (ids.has(property.id))
        errors.push(`${symbol.id}: duplicate component property id "${property.id}"`)
      ids.add(property.id)

      if (keys.has(property.key))
        errors.push(`${symbol.id}: duplicate component property key "${property.key}"`)
      keys.add(property.key)

      const targetKey = `${property.target.blockId}:${property.target.prop}`
      if (targets.has(targetKey))
        errors.push(`${symbol.id}: duplicate component property target "${targetKey}"`)
      targets.add(targetKey)

      const block = findBlock([symbol.root], property.target.blockId)
      if (!block) {
        errors.push(`${symbol.id}: property "${property.key}" targets missing block "${property.target.blockId}"`)
        continue
      }
      const definition = registry[block.type]
      const knownProps = definition?.defaultProps as Record<string, unknown> | undefined
      if (!(property.target.prop in (block.props as Record<string, unknown>)) && !(knownProps && property.target.prop in knownProps))
        errors.push(`${symbol.id}: property "${property.key}" targets unknown prop "${property.target.prop}" on "${block.type}"`)
    }
  }

  return { success: errors.length === 0, errors }
}

/** Validate component-only Slot placement, naming and instance fill references. */
export function validateComponentSlots(document: PageDocument): ValidationResult {
  const errors: string[] = []

  function visitPageBlocks(blocks: PageBlock[]): void {
    for (const block of blocks) {
      if (block.type === COMPONENT_SLOT_BLOCK_TYPE)
        errors.push(`${block.id}: Slot blocks are only valid inside component masters`)
      if (block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE)
        errors.push(`${block.id}: component slot fills must be direct children of a component instance`)

      if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
        const symbolId = (block.props as Record<string, unknown>).symbolId
        const symbol = typeof symbolId === 'string' ? document.symbols?.[symbolId] : undefined
        const validSlots = new Set(symbol ? getSymbolSlots(symbol).map(slot => slot.id) : [])
        const seenFills = new Set<string>()
        for (const fill of getInstanceSlotFills(block)) {
          const slotId = fill.props.slotId
          if (!validSlots.has(slotId))
            errors.push(`${fill.id}: fill targets unknown slot "${slotId}"`)
          if (seenFills.has(slotId))
            errors.push(`${fill.id}: duplicate fill for slot "${slotId}"`)
          seenFills.add(slotId)
          visitPageBlocks(fill.children ?? [])
        }
        for (const child of block.children ?? []) {
          if (child.type !== SYMBOL_SLOT_FILL_BLOCK_TYPE)
            errors.push(`${child.id}: component instance children must be slot fills`)
        }
        continue
      }

      if (block.children?.length)
        visitPageBlocks(block.children)
    }
  }

  visitPageBlocks(document.blocks)

  for (const symbol of Object.values(document.symbols ?? {})) {
    const names = new Set<string>()
    function visitMaster(block: PageBlock, insideSlot: boolean): void {
      if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE)
        return
      const isSlot = block.type === COMPONENT_SLOT_BLOCK_TYPE
      if (isSlot) {
        const name = (block.props as Record<string, unknown>).name
        if (typeof name !== 'string' || !name.trim())
          errors.push(`${symbol.id}: Slot "${block.id}" needs a name`)
        else if (names.has(name))
          errors.push(`${symbol.id}: duplicate Slot name "${name}"`)
        else names.add(name)
        if (insideSlot)
          errors.push(`${symbol.id}: Slot "${block.id}" cannot be nested inside another Slot`)
      }
      for (const child of block.children ?? [])
        visitMaster(child, insideSlot || isSlot)
    }
    visitMaster(symbol.root, false)
  }

  return { success: errors.length === 0, errors }
}
