import type { BlockDefinition, BlockRegistry } from '@/core/types/block-registry'
import type {
  PageBlock,
  PageDocument,
  PageSettings,
  SymbolDefinition,
  SymbolInstanceBlockProps,
  SymbolVariant,
} from '@/core/types/page-document'
import { SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core/types/page-document'
import { filterBlockTree, mapBlockTree } from '@/core/utils/block-tree'
import { cloneJsonValue } from '@/core/utils/clone'
import { createShortId } from '@/core/utils/ids'

// Generated ids are `<prefix>_<8 hex chars>`: unique enough within a document
// (4×10⁹ space) and short enough that everything derived from them — the
// `uf-block-<id>` selector, exported markup — stays readable.
// `autoBlockClassName` detects this exact shape to fall back to type-based
// auto class names (`section`, `section-2`).
export function createPageDocument(partial: Partial<PageDocument> = {}): PageDocument {
  const settings: PageSettings = {
    width: 'responsive',
    background: '#f8fafc',
    ...partial.settings,
  }

  return {
    id: partial.id ?? createShortId('page'),
    title: partial.title ?? 'Untitled page',
    // Preserve the group so "+ page" on a group header lands inside it.
    ...(partial.group ? { group: partial.group } : {}),
    version: partial.version ?? 1,
    blocks: partial.blocks ?? [],
    settings,
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  }
}

export function createBlock<TProps>(
  definition: BlockDefinition<TProps>,
  props?: Partial<TProps>,
): PageBlock<TProps> {
  return {
    id: createShortId(definition.type),
    type: definition.type,
    props: {
      ...definition.defaultProps,
      ...props,
    },
    ...(definition.defaultStyle ? { style: { ...definition.defaultStyle } } : {}),
  }
}

/**
 * Deep-clone a block tree with fresh IDs at every node. Used when
 * detaching a symbol instance — the produced tree must coexist with other
 * instances of the same symbol, so it can't share IDs with the master.
 */
export function cloneBlockWithNewIds(block: PageBlock): PageBlock {
  return {
    ...block,
    id: createShortId(block.type),
    props: cloneJsonValue(block.props),
    style: block.style ? cloneJsonValue(block.style) : undefined,
    classes: block.classes ? [...block.classes] : undefined,
    children: block.children?.map(cloneBlockWithNewIds),
  }
}

export function createSymbolDefinitionFromBlock(name: string, block: PageBlock): SymbolDefinition {
  const defaultVariant: SymbolVariant = {
    id: createShortId('var'),
    name: 'Default',
    classes: [],
  }
  return {
    id: createShortId('sym'),
    name,
    // Snapshot the subtree so future mutations to document.blocks don't
    // accidentally leak into the master.
    root: cloneJsonValue(block),
    variants: [defaultVariant],
    defaultVariantId: defaultVariant.id,
    updatedAt: new Date().toISOString(),
  }
}

export function createSymbolVariant(name: string, classes: string[] = []): SymbolVariant {
  return { id: createShortId('var'), name, classes: [...classes] }
}

export function createSymbolInstanceBlock(symbolId: string): PageBlock<SymbolInstanceBlockProps> {
  return {
    id: createShortId('inst'),
    type: SYMBOL_INSTANCE_BLOCK_TYPE,
    props: { symbolId },
  }
}

export function getInstanceSymbolId(block: PageBlock): string | null {
  if (block.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
    return null
  const id = (block.props as Record<string, unknown>).symbolId
  return typeof id === 'string' ? id : null
}

export function getInstanceVariantId(block: PageBlock): string | null {
  if (block.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
    return null
  const id = (block.props as Record<string, unknown>).variantId
  return typeof id === 'string' ? id : null
}

/**
 * Resolve the variant that should be rendered for an instance: an explicit
 * `variantId` wins, otherwise the symbol's default variant is used.
 */
export function resolveActiveVariant(
  symbol: SymbolDefinition,
  variantId?: string | null,
): SymbolVariant {
  const variants = symbol.variants
  if (variantId) {
    const explicit = variants.find(v => v.id === variantId)
    if (explicit)
      return explicit
  }
  return variants.find(v => v.id === symbol.defaultVariantId) ?? variants[0]!
}

/**
 * Returns the master root with the active variant's classes appended.
 * Used by both the canvas renderer and the HTML exporter so behaviour
 * stays consistent.
 */
export function applyVariantToRoot(
  symbol: SymbolDefinition,
  variant: SymbolVariant,
): PageBlock {
  if (!variant.classes.length)
    return symbol.root
  return {
    ...symbol.root,
    classes: [...(symbol.root.classes ?? []), ...variant.classes],
  }
}

export function createBlockRegistry(definitions: BlockDefinition[]): BlockRegistry {
  return definitions.reduce<BlockRegistry>((registry, definition) => {
    registry[definition.type] = definition
    return registry
  }, {})
}

/**
 * Apply a map across every tree owned by the document: top-level `blocks`
 * AND each symbol's master root. Critical for cross-tree mutations like
 * class rename/delete — otherwise class refs inside symbol roots go stale.
 */
export function mapDocumentBlocks(
  document: PageDocument,
  fn: (block: PageBlock) => PageBlock,
): PageDocument {
  const blocks = mapBlockTree(document.blocks, fn)
  const symbols = document.symbols
    ? Object.fromEntries(
        Object.entries(document.symbols).map(([id, sym]) => {
          const [nextRoot] = mapBlockTree([sym.root], fn)
          return [id, nextRoot ? { ...sym, root: nextRoot } : sym]
        }),
      )
    : undefined
  return { ...document, blocks, symbols }
}

export function filterDocumentBlocks(
  document: PageDocument,
  predicate: (block: PageBlock) => boolean,
): PageDocument {
  const blocks = filterBlockTree(document.blocks, predicate)
  // Symbol roots are single blocks — only filter their children, never drop
  // the root itself (deleteSymbol owns root-level removal).
  const symbols = document.symbols
    ? Object.fromEntries(
        Object.entries(document.symbols).map(([id, sym]) => {
          if (!sym.root.children?.length)
            return [id, sym]
          return [id, { ...sym, root: { ...sym.root, children: filterBlockTree(sym.root.children, predicate) } }]
        }),
      )
    : undefined
  return { ...document, blocks, symbols }
}
