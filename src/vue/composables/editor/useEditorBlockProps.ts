import type { ShallowRef } from 'vue'
import type { BlockRegistry, BlockStyles, PageBlock, PageDocument } from '@/core'
import { findBlock, validateBlockProps } from '@/core'

export interface UseEditorBlockPropsOptions {
  document: ShallowRef<PageDocument>
  registry: ShallowRef<BlockRegistry>
  errors: ShallowRef<string[]>
  updateBlock: (id: string, updater: (block: PageBlock) => PageBlock) => void
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  validateSlotPropsUpdate: (block: PageBlock, nextProps: Record<string, unknown>) => boolean
}

/** Owns block prop validation plus block/page style metadata updates. */
export function useEditorBlockProps(options: UseEditorBlockPropsOptions) {
  const { document, registry, errors, updateBlock, commit, validateSlotPropsUpdate } = options

  function updateBlockProps(id: string, propsPatch: Record<string, unknown>) {
    const block = findBlock(document.value.blocks, id)
    if (!block)
      return false

    const nextProps = { ...block.props, ...propsPatch }
    if (!validateSlotPropsUpdate(block, nextProps))
      return false
    const result = validateBlockProps({ ...block, props: nextProps }, registry.value)
    if (!result.success) {
      errors.value = result.errors
      return false
    }

    errors.value = []
    updateBlock(id, current => ({ ...current, props: nextProps }))
    return true
  }

  function replaceBlockProps(id: string, nextProps: Record<string, unknown>) {
    const block = findBlock(document.value.blocks, id)
    if (!block)
      return false
    if (!validateSlotPropsUpdate(block, nextProps))
      return false

    const result = validateBlockProps({ type: block.type, props: nextProps }, registry.value)
    if (!result.success) {
      errors.value = result.errors
      return false
    }

    errors.value = []
    updateBlock(id, current => ({ ...current, props: nextProps }))
    return true
  }

  function updateBlockStyle(id: string, nextStyle: BlockStyles) {
    if (!findBlock(document.value.blocks, id))
      return false
    updateBlock(id, current => ({ ...current, style: { ...nextStyle } }))
    return true
  }

  function setBlockHtmlId(id: string, value: string) {
    const next = value.trim()
    updateBlock(id, current => ({ ...current, htmlId: next || undefined }))
    return true
  }

  function setBlockName(id: string, value: string) {
    if (!findBlock(document.value.blocks, id))
      return false
    const next = value.trim()
    updateBlock(id, current => ({ ...current, name: next || undefined }))
    return true
  }

  function updatePageStyle(nextStyle: BlockStyles) {
    commit({
      ...document.value,
      settings: { ...document.value.settings, style: { ...nextStyle } },
    }, 'history.pageStyle')
  }

  return {
    updateBlockProps,
    replaceBlockProps,
    updateBlockStyle,
    setBlockHtmlId,
    setBlockName,
    updatePageStyle,
  }
}
