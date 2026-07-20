import type { PageBlock, ResolveContext } from '@/core'
import { computed } from 'vue'
import { assetKey, DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE, resolveBindingPath } from '@/core'

export interface UseCanvasBlockPreviewOptions {
  block: () => PageBlock
  scope: () => Record<string, unknown> | undefined
  dataContext: () => ResolveContext | undefined
  assetPreviews: () => Record<string, string> | undefined
}

/**
 * Resolves preview-only block values for the canvas. It never writes to the
 * document: bindings and picked assets only alter the values sent to the
 * renderer, while Data List/Item blocks provide a scoped sample record to
 * their descendants.
 */
export function useCanvasBlockPreview(options: UseCanvasBlockPreviewOptions) {
  const displayProps = computed<Record<string, unknown>>(() => {
    const block = options.block()
    const dataContext = options.dataContext()
    const scope = options.scope()
    let next: Record<string, unknown> | null = null

    if (block.bindings) {
      const bindingScope = { page: dataContext?.page, item: scope ?? dataContext?.item }
      for (const [key, path] of Object.entries(block.bindings)) {
        const value = resolveBindingPath(path, bindingScope)
        if (value === undefined)
          continue
        next ??= { ...block.props }
        next[key] = value
      }
    }

    if (block.asset) {
      const key = assetKey(block.asset)
      const url = options.assetPreviews()?.[key]
        ?? dataContext?.assets?.[key]
        ?? dataContext?.resolveAsset?.(block.asset)
      if (url) {
        next ??= { ...block.props }
        next.src = url
      }
    }

    return next ?? block.props
  })

  const dataListRows = computed<Array<Record<string, unknown>> | null>(() => {
    const block = options.block()
    if (block.type !== DATA_LIST_BLOCK_TYPE)
      return null
    const rows = options.dataContext()?.data?.[block.id]
    if (!Array.isArray(rows) || rows.length === 0)
      return null
    const limit = block.source?.limit
    const capped = typeof limit === 'number' && limit > 0 ? rows.slice(0, limit) : rows
    return capped as Array<Record<string, unknown>>
  })

  const childScope = computed<Record<string, unknown> | undefined>(() => {
    const block = options.block()
    const data = options.dataContext()?.data
    if (block.type === DATA_LIST_BLOCK_TYPE) {
      const rows = data?.[block.id]
      return Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined
    }
    if (block.type === DATA_ITEM_BLOCK_TYPE) {
      const record = data?.[block.id]
      return record && typeof record === 'object' && !Array.isArray(record)
        ? (record as Record<string, unknown>)
        : undefined
    }
    return options.scope()
  })

  return { displayProps, dataListRows, childScope }
}
