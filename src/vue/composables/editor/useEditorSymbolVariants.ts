import type { ShallowRef } from 'vue'
import type { BlockStyles, GlobalSettings, PageDocument, SymbolDefinition } from '@/core'
import {
  createSymbolVariant,
  findBlock,
  mapDocumentBlocks,
  normalizeSimpleClassNames,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  updateBlockInTree,
} from '@/core'

export interface UseEditorSymbolVariantsOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  activeStyles: () => Record<string, BlockStyles>
  updateSymbol: (id: string, updater: (symbol: SymbolDefinition) => SymbolDefinition) => boolean
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
  commitBoth: (document: PageDocument, globals: GlobalSettings, label?: string) => void
}

/** Owns variant metadata and instance-variant cleanup for component symbols. */
export function useEditorSymbolVariants(options: UseEditorSymbolVariantsOptions) {
  const { document, globals, activeSymbols, activeStyles, updateSymbol, commit, commitGlobals, commitBoth } = options

  function createVariant(symbolId: string, name: string): string | false {
    const trimmed = name.trim()
    if (!trimmed)
      return false
    const symbol = activeSymbols()[symbolId]
    if (!symbol)
      return false
    const variant = createSymbolVariant(trimmed)
    const variants = [...symbol.variants, variant]
    const defaultVariantId = symbol.defaultVariantId
    updateSymbol(symbolId, current => ({ ...current, variants, defaultVariantId }))
    return variant.id
  }

  function renameVariant(symbolId: string, variantId: string, nextName: string): boolean {
    const trimmed = nextName.trim()
    const symbol = activeSymbols()[symbolId]
    if (!trimmed || !symbol?.variants.some(variant => variant.id === variantId))
      return false
    const variants = symbol.variants.map(variant =>
      variant.id === variantId ? { ...variant, name: trimmed } : variant,
    )
    return updateSymbol(symbolId, current => ({ ...current, variants }))
  }

  function deleteVariant(symbolId: string, variantId: string): boolean {
    const symbol = activeSymbols()[symbolId]
    if (!symbol?.variants.some(variant => variant.id === variantId) || symbol.variants.length <= 1)
      return false
    const variants = symbol.variants.filter(variant => variant.id !== variantId)
    const defaultVariantId = symbol.defaultVariantId === variantId ? variants[0]!.id : symbol.defaultVariantId
    const mapped = mapDocumentBlocks(
      { ...document.value, symbols: { ...activeSymbols(), [symbolId]: { ...symbol, variants, defaultVariantId } } },
      (block) => {
        if (block.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
          return block
        const props = block.props as Record<string, unknown>
        if (props.symbolId !== symbolId || props.variantId !== variantId)
          return block
        const { variantId: _drop, ...rest } = props
        return { ...block, props: rest }
      },
    )
    if (globals.value)
      commitBoth({ ...document.value, blocks: mapped.blocks }, { ...globals.value, symbols: mapped.symbols })
    else
      commit(mapped)
    return true
  }

  function setVariantClasses(symbolId: string, variantId: string, classes: string[]): boolean {
    const symbol = activeSymbols()[symbolId]
    if (!symbol?.variants.some(variant => variant.id === variantId))
      return false
    const cleaned = normalizeSimpleClassNames(classes)
    const styles = { ...activeStyles() }
    let stylesChanged = false
    for (const className of cleaned) {
      if (!styles[className]) {
        styles[className] = {}
        stylesChanged = true
      }
    }
    const variants = symbol.variants.map(variant =>
      variant.id === variantId ? { ...variant, classes: cleaned } : variant,
    )
    const symbols = { ...activeSymbols(), [symbolId]: { ...symbol, variants, updatedAt: new Date().toISOString() } }
    if (globals.value)
      commitGlobals({ ...globals.value, symbols, ...(stylesChanged ? { styles } : {}) })
    else
      commit({ ...document.value, symbols, ...(stylesChanged ? { styles } : {}) })
    return true
  }

  function setInstanceVariant(blockId: string, variantId: string | null): boolean {
    const instance = findBlock(document.value.blocks, blockId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const blocks = updateBlockInTree(document.value.blocks, blockId, (current) => {
      const props = { ...(current.props as Record<string, unknown>) }
      if (variantId === null)
        delete props.variantId
      else
        props.variantId = variantId
      return { ...current, props }
    })
    commit({ ...document.value, blocks })
    return true
  }

  return { createVariant, renameVariant, deleteVariant, setVariantClasses, setInstanceVariant }
}
