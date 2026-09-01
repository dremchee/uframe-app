import type { GlobalSettings, PageBlock, PageDocument, SymbolDefinition } from '@/core/types/page-document'
import { ELEMENT_BLOCK_TYPE } from '@/core/types/page-document'
import { mapBlockTree } from '@/core/utils/block-tree'

/**
 * One retired block type and what it becomes on load.
 *
 * Renaming a type is self-versioning: a stored `type: 'section'` is itself the
 * proof that the document predates the rename, so conversions need no schema
 * version counter. That only holds while merges introduce a *new* type id
 * instead of reusing one of the merged names — `element` rather than `div`. Keep
 * following that rule and this table stays the whole migration story.
 */
export interface BlockConversion {
  /** Retired type, as it appears in stored documents. */
  from: string
  /** Type it becomes. Must exist in the registry. */
  to: string
  /** Old props → new props. Omit to carry props over unchanged. */
  props?: (props: Record<string, unknown>) => Record<string, unknown>
  /** Release that retired `from`, for the deprecation sweep. */
  since: string
}

/**
 * Built-in conversions. Entries are cheap (three lines) and a document only
 * converts when someone opens it, so retire an entry by how many releases users
 * have had a chance to open a document in — not by date.
 */
export const BLOCK_CONVERSIONS: BlockConversion[] = [
  // 0.18: Section / Container / Div were one block wearing three labels —
  // identical props, identical schema, and Container/Div emitted byte-identical
  // HTML. They collapse into Element, which carries the tag as a prop.
  { from: 'section', to: ELEMENT_BLOCK_TYPE, props: p => ({ ...p, tag: 'section' }), since: '0.18' },
  { from: 'container', to: ELEMENT_BLOCK_TYPE, props: p => ({ ...p, tag: 'div' }), since: '0.18' },
  { from: 'div', to: ELEMENT_BLOCK_TYPE, props: p => ({ ...p, tag: 'div' }), since: '0.18' },
]

export interface ConvertLegacyOptions {
  /** Host / plugin conversions, applied after the built-ins (last wins). */
  conversions?: BlockConversion[]
  /**
   * Whether a type is live in the registry. Block types are a flat namespace
   * shared with plugins, so a retired name can be claimed again by someone
   * else's block — a registered type is theirs and is never converted.
   */
  isRegistered?: (type: string) => boolean
  /** Called once per converted block — for a host-facing report. */
  onConvert?: (from: string, to: string) => void
}

/**
 * Builds the per-block rewrite.
 *
 * Only types listed in the table are rewritten. An unrecognised type is left
 * exactly as it is: it may belong to a plugin this host has not loaded, and
 * flattening it here would destroy it on the next autosave. The canvas and the
 * export render such a block as an Element without touching the stored document.
 */
function createConverter(options: ConvertLegacyOptions): (block: PageBlock) => PageBlock {
  const byType: Record<string, BlockConversion> = {}
  for (const conversion of [...BLOCK_CONVERSIONS, ...(options.conversions ?? [])])
    byType[conversion.from] = conversion

  return (block) => {
    const conversion = byType[block.type]
    if (!conversion || options.isRegistered?.(block.type))
      return block
    options.onConvert?.(conversion.from, conversion.to)
    return {
      ...block,
      type: conversion.to,
      props: conversion.props?.(block.props) ?? block.props,
    }
  }
}

function convertSymbols(
  symbols: Record<string, SymbolDefinition>,
  convert: (block: PageBlock) => PageBlock,
): Record<string, SymbolDefinition> {
  return Object.fromEntries(
    Object.entries(symbols).map(([id, symbol]) => {
      const [root] = mapBlockTree([symbol.root], convert)
      return [id, root ? { ...symbol, root } : symbol]
    }),
  )
}

/**
 * Rewrites retired block types across every tree the document owns — including
 * symbol masters, which hold block trees of their own and would otherwise keep
 * every component's internals on the retired type.
 *
 * Idempotent: a converted document passes through untouched, so this is safe to
 * call at every entry point without tracking whether it already ran.
 */
export function convertLegacyBlocks(
  document: PageDocument,
  options: ConvertLegacyOptions = {},
): PageDocument {
  const convert = createConverter(options)
  const blocks = mapBlockTree(document.blocks, convert)
  return document.symbols
    ? { ...document, blocks, symbols: convertSymbols(document.symbols, convert) }
    : { ...document, blocks }
}

/** The same pass over the symbol masters carried by context-level globals. */
export function convertLegacyGlobals(
  globals: GlobalSettings,
  options: ConvertLegacyOptions = {},
): GlobalSettings {
  if (!globals.symbols)
    return globals
  return { ...globals, symbols: convertSymbols(globals.symbols, createConverter(options)) }
}
