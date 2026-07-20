import type { PageBlock, ResolveContext, SymbolDefinition } from '@/core'
import { computed } from 'vue'
import {
  getInstanceSymbolId,
  materializeSymbolInstance,
  resolveBindingPath,
  SYMBOL_INSTANCE_BLOCK_TYPE,
} from '@/core'

export interface UseCanvasSymbolInstanceOptions {
  block: () => PageBlock
  symbols: () => Record<string, SymbolDefinition> | undefined
  ancestorSymbols: () => ReadonlySet<string> | undefined
  scope: () => Record<string, unknown> | undefined
  dataContext: () => ResolveContext | undefined
}

/**
 * Resolves the component-master tree rendered by one symbol instance. Binding
 * values are preview-only; the composable never mutates the document or master.
 */
export function useCanvasSymbolInstance(options: UseCanvasSymbolInstanceOptions) {
  const isSymbolInstance = computed(() => options.block().type === SYMBOL_INSTANCE_BLOCK_TYPE)
  const symbolId = computed(() =>
    isSymbolInstance.value ? getInstanceSymbolId(options.block()) : null,
  )
  const isCircular = computed(() =>
    !!symbolId.value && !!options.ancestorSymbols()?.has(symbolId.value),
  )
  const symbol = computed<SymbolDefinition | undefined>(() => {
    if (!symbolId.value || isCircular.value)
      return undefined
    return options.symbols()?.[symbolId.value]
  })
  const propertyValues = computed<Record<string, unknown> | undefined>(() => {
    const block = options.block()
    if (!isSymbolInstance.value || !block.bindings)
      return undefined

    const dataContext = options.dataContext()
    const scope = { page: dataContext?.page, item: options.scope() ?? dataContext?.item }
    const values: Record<string, unknown> = {}
    for (const [propertyId, path] of Object.entries(block.bindings)) {
      const value = resolveBindingPath(path, scope)
      if (value !== undefined)
        values[propertyId] = value
    }
    return Object.keys(values).length ? values : undefined
  })
  const materializedSymbol = computed(() => {
    if (!symbol.value)
      return undefined
    return materializeSymbolInstance(options.block(), symbol.value, {
      propertyValues: propertyValues.value,
    })
  })
  const materializedRoot = computed<PageBlock | undefined>(() => materializedSymbol.value?.root)
  const nestedAncestorSymbols = computed<ReadonlySet<string>>(() => {
    if (!symbolId.value)
      return options.ancestorSymbols() ?? new Set()
    const next = new Set(options.ancestorSymbols() ?? [])
    next.add(symbolId.value)
    return next
  })

  return {
    isCircular,
    isSymbolInstance,
    materializedRoot,
    materializedSymbol,
    nestedAncestorSymbols,
    symbol,
  }
}
