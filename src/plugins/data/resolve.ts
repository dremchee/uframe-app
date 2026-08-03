import type { PageBlock, PageDocument } from '@/core/types/page-document'
import type { DataScope, ResolveContext } from '@/core/utils/resolve'
import { assetKey, resolveBindingPath } from '@/core/utils/resolve'
import { cloneJsonValue } from '@/core/utils/clone'
import { setInstancePropertyValue } from '@/core/utils/symbol-properties'
import { DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE } from './types'

interface ResolveEnv {
  data: Record<string, unknown>
  resolveAsset?: ResolveContext['resolveAsset']
  assets?: Record<string, string>
}

function resolveProps(block: PageBlock, scope: DataScope, env: ResolveEnv): Record<string, unknown> {
  const props = block.props as Record<string, unknown>
  let next: Record<string, unknown> | null = null
  for (const [prop, path] of Object.entries(block.bindings ?? {})) {
    const value = resolveBindingPath(path, scope)
    if (value === undefined)
      continue
    if (block.type === '__symbol')
      next = setInstancePropertyValue(next ?? props, prop, value)
    else {
      next ??= { ...props }
      next[prop] = value
    }
  }
  if (block.asset) {
    const url = env.resolveAsset?.(block.asset) ?? env.assets?.[assetKey(block.asset)]
    if (url !== undefined) {
      next ??= { ...props }
      next.src = url
    }
  }
  return next ?? props
}

function cloneSubtreeWithSuffix(block: PageBlock, suffix: string): PageBlock {
  return {
    ...block,
    id: `${block.id}${suffix}`,
    props: cloneJsonValue(block.props),
    style: block.style ? cloneJsonValue(block.style) : undefined,
    classes: block.classes ? [...block.classes] : undefined,
    attributes: block.attributes ? { ...block.attributes } : undefined,
    bindings: block.bindings ? { ...block.bindings } : undefined,
    source: block.source ? { ...block.source } : undefined,
    asset: block.asset ? { ...block.asset } : undefined,
    children: block.children?.map(child => cloneSubtreeWithSuffix(child, suffix)),
  }
}

function strip(block: PageBlock, props: Record<string, unknown>, children?: PageBlock[]): PageBlock {
  const next: PageBlock = { ...block, props }
  if (children)
    next.children = children
  else
    delete next.children
  delete next.bindings
  delete next.source
  delete next.asset
  return next
}

function resolveBlock(block: PageBlock, scope: DataScope, env: ResolveEnv): PageBlock {
  if (block.type === DATA_LIST_BLOCK_TYPE) {
    const rows = env.data[block.id]
    const children = Array.isArray(rows)
      ? rows.flatMap((row, index) => (block.children ?? []).map(child =>
          resolveBlock(cloneSubtreeWithSuffix(child, `~${index}`), { page: scope.page, item: row }, env),
        ))
      : []
    return strip(block, resolveProps(block, scope, env), children)
  }
  if (block.type === DATA_ITEM_BLOCK_TYPE) {
    const item = env.data[block.id]
    const children = block.children?.map(child => resolveBlock(child, { page: scope.page, item }, env))
    return strip(block, resolveProps(block, scope, env), children)
  }
  const children = block.children?.map(child => resolveBlock(child, scope, env))
  return strip(block, resolveProps(block, scope, env), children)
}

/** Resolves Data plugin scopes, bindings and media references into a static tree. */
export function resolveDataDocument(document: PageDocument, context: ResolveContext = {}): PageDocument {
  const env: ResolveEnv = {
    data: context.data ?? {},
    resolveAsset: context.resolveAsset,
    assets: context.assets,
  }
  const scope: DataScope = { page: context.page, item: context.item }
  return { ...document, blocks: document.blocks.map(block => resolveBlock(block, scope, env)) }
}
