import type { ShallowRef } from 'vue'
import type { PageDocument, SymbolDefinition } from '@/core'
import {
  findBlock,
  getInstanceSymbolId,
  removeInstancePropertyValue,
  setInstancePropertyValue,
  SYMBOL_INSTANCE_BLOCK_TYPE,
  updateBlockInTree,
} from '@/core'
import {
  humanizePropertyKey,
  inferPublicPropertyKey,
  inferSymbolPropertyControl,
  makeSymbolPropertyId,
  uniqueSymbolPropertyKey,
} from '@/vue/utils/symbol-editor'

export interface UseEditorSymbolPropertiesOptions {
  document: ShallowRef<PageDocument>
  editingSymbolId: ShallowRef<string | null>
  activeSymbols: () => Record<string, SymbolDefinition>
  updateSymbol: (symbolId: string, updater: (symbol: SymbolDefinition) => SymbolDefinition) => boolean
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
}

/** Owns public component property definitions and instance values. */
export function useEditorSymbolProperties(options: UseEditorSymbolPropertiesOptions) {
  const { document, editingSymbolId, activeSymbols, updateSymbol, commit } = options

  /** Publish one scalar prop from the currently edited component master. */
  function addSymbolProperty(blockId: string, prop: string, label?: string): string | false {
    const symbolId = editingSymbolId.value
    if (!symbolId || !prop)
      return false
    const symbol = activeSymbols()[symbolId]
    const target = findBlock(document.value.blocks, blockId)
    if (!symbol || !target || target.type === SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    if (!Object.hasOwn(target.props, prop))
      return false
    if ((symbol.properties ?? []).some(property =>
      property.target.blockId === blockId && property.target.prop === prop,
    )) {
      return false
    }

    const value = (target.props as Record<string, unknown>)[prop]
    if (value !== null && !['string', 'number', 'boolean'].includes(typeof value))
      return false

    const preferredKey = inferPublicPropertyKey(prop)
    const property = {
      id: makeSymbolPropertyId(),
      key: uniqueSymbolPropertyKey(symbol, preferredKey),
      label: label?.trim() || humanizePropertyKey(preferredKey),
      target: { blockId, prop },
      control: inferSymbolPropertyControl(prop, value),
    }
    return updateSymbol(symbolId, current => ({
      ...current,
      properties: [...(current.properties ?? []), property],
    }))
      ? property.id
      : false
  }

  function removeSymbolProperty(symbolId: string, propertyId: string): boolean {
    const symbol = activeSymbols()[symbolId]
    if (!symbol?.properties?.some(property => property.id === propertyId))
      return false
    return updateSymbol(symbolId, (current) => {
      const properties = (current.properties ?? []).filter(property => property.id !== propertyId)
      const next = { ...current }
      if (properties.length)
        next.properties = properties
      else
        delete next.properties
      return next
    })
  }

  /** Rename a property's display label; its stable key remains unchanged. */
  function renameSymbolProperty(symbolId: string, propertyId: string, label: string): boolean {
    const trimmed = label.trim()
    const symbol = activeSymbols()[symbolId]
    const property = symbol?.properties?.find(candidate => candidate.id === propertyId)
    if (!trimmed || !property || property.label === trimmed)
      return false
    return updateSymbol(symbolId, current => ({
      ...current,
      properties: (current.properties ?? []).map(candidate =>
        candidate.id === propertyId ? { ...candidate, label: trimmed } : candidate,
      ),
    }))
  }

  function setInstanceProperty(blockId: string, propertyId: string, value: unknown): boolean {
    const instance = findBlock(document.value.blocks, blockId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const symbolId = getInstanceSymbolId(instance)
    const symbol = symbolId ? activeSymbols()[symbolId] : undefined
    if (!symbol?.properties?.some(property => property.id === propertyId))
      return false
    if (typeof value === 'number' && !Number.isFinite(value))
      return false

    const blocks = updateBlockInTree(document.value.blocks, blockId, current => ({
      ...current,
      props: setInstancePropertyValue(current.props as Record<string, unknown>, propertyId, value),
    }))
    commit({ ...document.value, blocks }, 'history.editComponentProperty', true)
    return true
  }

  function resetInstanceProperty(blockId: string, propertyId: string): boolean {
    const instance = findBlock(document.value.blocks, blockId)
    if (!instance || instance.type !== SYMBOL_INSTANCE_BLOCK_TYPE)
      return false
    const currentValues = (instance.props as Record<string, unknown>).propertyValues
    if (!currentValues || typeof currentValues !== 'object' || Array.isArray(currentValues)
      || !Object.hasOwn(currentValues, propertyId)) {
      return false
    }

    const blocks = updateBlockInTree(document.value.blocks, blockId, current => ({
      ...current,
      props: removeInstancePropertyValue(current.props as Record<string, unknown>, propertyId),
    }))
    commit({ ...document.value, blocks }, 'history.resetComponentProperty')
    return true
  }

  return {
    addSymbolProperty,
    removeSymbolProperty,
    renameSymbolProperty,
    setInstanceProperty,
    resetInstanceProperty,
  }
}
