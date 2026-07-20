import type { AssetRef, PageBlock, PageDocument } from '@/core/types/page-document'
import {
  DATA_ITEM_BLOCK_TYPE,
  DATA_LIST_BLOCK_TYPE,
  SYMBOL_INSTANCE_BLOCK_TYPE,
} from '@/core/types/page-document'
import { cloneJsonValue } from '@/core/utils/clone'
import { setInstancePropertyValue } from '@/core/utils/symbol-properties'

// Frontend-side resolution of a binding-carrying PageDocument into a static
// block tree, using data the consumer has already fetched. Pure, synchronous
// and CMS-agnostic: the document declares WHAT it needs (paths + `source`
// queries), the adapter/SSR fetches it, this maps it in.
// See docs/plans/dynamic-content-plan.md.

/** Data scope a binding path is resolved against. */
export interface DataScope {
  /** Page-level record, addressed via `page.*`. */
  page?: unknown
  /** Nearest current record, addressed via `item.*`. */
  item?: unknown
}

/**
 * Everything the consumer supplies to `resolveDocument`:
 * - `page` / `item` — the root scope (e.g. a detail-route record).
 * - `data` — per-block fetched data keyed by block id: an array for a
 *   `data-list`, a single record for a `data-item`. Obtain the keys
 *   to fetch via `collectDataRequirements`.
 */
export interface ResolveContext extends DataScope {
  data?: Record<string, unknown>
  /**
   * Turn a media-library `AssetRef` into a concrete URL (CMS-specific; supplied
   * by the adapter / SSR app). Returning `undefined` leaves the block's authored
   * `src` fallback. `resolveDocument` writes the result into `props.src`.
   *
   * A function can't cross `postMessage` — over the iframe embed the host sends
   * the serializable `assets` map below instead (consulted as a fallback here).
   */
  resolveAsset?: (ref: AssetRef) => string | undefined
  /** Pre-resolved asset URLs keyed by `assetKey(ref)` — the serializable form. */
  assets?: Record<string, string>
}

/** Stable key for an asset ref — used to cache / look up its resolved URL. */
export function assetKey(ref: AssetRef): string {
  return `${ref.source}:${ref.id}`
}

/**
 * Look up a dot-path in the scope. Paths are rooted: `item.*` hits the current
 * record, `page.*` the page record. An unrooted or missing path yields
 * `undefined` (the block keeps its authored fallback). Traverses nested objects
 * so relation fields work (`item.author.name`).
 */
export function resolveBindingPath(path: string, scope: DataScope): unknown {
  const segments = path.split('.')
  const [root, ...rest] = segments

  let current: unknown
  if (root === 'page')
    current = scope.page
  else if (root === 'item')
    current = scope.item
  else
    return undefined

  for (const segment of rest) {
    if (current == null || typeof current !== 'object')
      return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

/** Everything `resolveBlock` threads down the tree besides the data scope. */
interface ResolveEnv {
  /** Per-block fetched data, keyed by block id (list → array, item → record). */
  data: Record<string, unknown>
  resolveAsset?: (ref: AssetRef) => string | undefined
  assets?: Record<string, string>
}

/**
 * Apply a block's `bindings` against a scope, returning the resolved props.
 * Only props whose path resolves to a defined value are overridden — anything
 * unbound or unresolved keeps the editor-time value.
 */
function applyBindings(block: PageBlock, scope: DataScope): Record<string, unknown> {
  const props = block.props as Record<string, unknown>
  if (!block.bindings)
    return props

  let next: Record<string, unknown> | null = null
  for (const [prop, path] of Object.entries(block.bindings)) {
    const value = resolveBindingPath(path, scope)
    if (value === undefined)
      continue
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
      next = setInstancePropertyValue(next ?? props, prop, value)
    }
    else {
      next ??= { ...props }
      next[prop] = value
    }
  }
  return next ?? props
}

/**
 * Resolve a block's media-library `asset` into `props.src`. An explicitly chosen
 * asset wins over any authored / bound `src`; an unresolvable ref leaves the
 * fallback untouched.
 */
function applyAsset(props: Record<string, unknown>, block: PageBlock, env: ResolveEnv): Record<string, unknown> {
  if (!block.asset)
    return props
  const url = env.resolveAsset?.(block.asset) ?? env.assets?.[assetKey(block.asset)]
  if (url === undefined)
    return props
  return { ...props, src: url }
}

/** Resolved props for a block: bindings applied, then the asset src override. */
function resolveProps(block: PageBlock, scope: DataScope, env: ResolveEnv): Record<string, unknown> {
  return applyAsset(applyBindings(block, scope), block, env)
}

/**
 * Deep-clone a subtree, suffixing every id so the per-row copies of a
 * `data-list` template stay unique (block styles key off `id`). Keeps
 * `bindings`/`source` so the clone can still be resolved.
 *
 * Caveat: `htmlId` is intentionally NOT suffixed (it's an author-facing DOM id);
 * avoid setting `htmlId` inside a `data-list` item — it would repeat.
 */
function cloneSubtreeWithSuffix(block: PageBlock, suffix: string): PageBlock {
  return {
    ...block,
    id: `${block.id}${suffix}`,
    props: cloneJsonValue(block.props),
    style: block.style ? cloneJsonValue(block.style) : undefined,
    classes: block.classes ? [...block.classes] : undefined,
    bindings: block.bindings ? { ...block.bindings } : undefined,
    source: block.source ? { ...block.source } : undefined,
    asset: block.asset ? { ...block.asset } : undefined,
    children: block.children?.map(child => cloneSubtreeWithSuffix(child, suffix)),
  }
}

/** Strip resolution metadata from a resolved block — the output tree is static. */
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

function resolveBlocks(blocks: PageBlock[], scope: DataScope, env: ResolveEnv): PageBlock[] {
  return blocks.map(block => resolveBlock(block, scope, env))
}

function resolveBlock(block: PageBlock, scope: DataScope, env: ResolveEnv): PageBlock {
  // data-list: expand the inline template once per fetched row, each in a
  // child scope where `item` is that row.
  if (block.type === DATA_LIST_BLOCK_TYPE) {
    const rows = env.data[block.id]
    const template = block.children ?? []
    const expanded = Array.isArray(rows)
      ? rows.flatMap((row, i) => {
          const rowScope: DataScope = { page: scope.page, item: row }
          const clones = template.map(child => cloneSubtreeWithSuffix(child, `~${i}`))
          return resolveBlocks(clones, rowScope, env)
        })
      : []
    return strip(block, resolveProps(block, scope, env), expanded)
  }

  // data-item: render children once against the single fetched record.
  if (block.type === DATA_ITEM_BLOCK_TYPE) {
    const record = env.data[block.id]
    const itemScope: DataScope = { page: scope.page, item: record }
    const children = block.children ? resolveBlocks(block.children, itemScope, env) : undefined
    return strip(block, resolveProps(block, scope, env), children)
  }

  // plain block: bind props + asset, recurse children in the same scope.
  const children = block.children ? resolveBlocks(block.children, scope, env) : undefined
  return strip(block, resolveProps(block, scope, env), children)
}

/**
 * Resolve a document into a static block tree using already-fetched `context`
 * data. Symbols are left untouched (the renderer inlines them). The result is a
 * plain `PageDocument` with no `bindings`/`source` — ready for
 * `renderDocumentToHtml` or a consumer's component mapping.
 */
export function resolveDocument(document: PageDocument, context: ResolveContext = {}): PageDocument {
  const scope: DataScope = { page: context.page, item: context.item }
  const env: ResolveEnv = { data: context.data ?? {}, resolveAsset: context.resolveAsset, assets: context.assets }
  return {
    ...document,
    blocks: resolveBlocks(document.blocks, scope, env),
  }
}
