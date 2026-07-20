import type { ShallowRef } from 'vue'
import type { AssetPick, AssetRef, BlockDataSource, PageBlock, PageDocument } from '@/core'
import { assetKey, findBlock } from '@/core'

export interface UseEditorBlockDataOptions {
  document: ShallowRef<PageDocument>
  assetPreviews: ShallowRef<Record<string, string>>
  updateBlock: (id: string, updater: (block: PageBlock) => PageBlock) => void
  updateBlockProps: (id: string, propsPatch: Record<string, unknown>) => boolean
}

/** Owns bindings, data sources and media assets attached to editor blocks. */
export function useEditorBlockData(options: UseEditorBlockDataOptions) {
  const { document, assetPreviews, updateBlock, updateBlockProps } = options

  /** Bind or unbind a prop to a dynamic-content path. */
  function setBlockBinding(id: string, prop: string, path: string | null) {
    updateBlock(id, (current) => {
      const bindings = { ...current.bindings }
      if (path)
        bindings[prop] = path
      else
        delete bindings[prop]

      const next = { ...current }
      if (Object.keys(bindings).length)
        next.bindings = bindings
      else
        delete next.bindings
      return next
    })
  }

  /** Set or clear a data-list/data-item query. */
  function setBlockSource(id: string, source: BlockDataSource | null) {
    updateBlock(id, (current) => {
      const next = { ...current }
      if (source?.collection)
        next.source = source
      else
        delete next.source
      return next
    })
  }

  /** Set or clear a media-library reference. */
  function setBlockAsset(id: string, asset: AssetRef | null) {
    updateBlock(id, (current) => {
      const next = { ...current }
      if (asset?.id)
        next.asset = asset
      else
        delete next.asset
      return next
    })
  }

  /** Persist a picked asset, cache its preview and seed an empty alt value. */
  function applyAsset(id: string, pick: AssetPick) {
    setBlockAsset(id, pick.ref)
    assetPreviews.value = { ...assetPreviews.value, [assetKey(pick.ref)]: pick.url }
    const block = findBlock(document.value.blocks, id)
    if (pick.meta?.alt && block && !(block.props as Record<string, unknown>).alt)
      updateBlockProps(id, { alt: pick.meta.alt })
  }

  return { setBlockBinding, setBlockSource, setBlockAsset, applyAsset }
}
