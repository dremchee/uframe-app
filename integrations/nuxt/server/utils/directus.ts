import type { AssetRef, GlobalSettings, PageBlock, PageDocument, ResolveContext } from '@dremchee/uframe/core'
import { assetKey, collectDataRequirements, mergeGlobalsIntoDocument } from '@dremchee/uframe/core'

// Server-side Directus adapter. Reads the page template stored by the uframe
// module (`uframe_pages.document`), merges shared globals, then fetches exactly
// the data the document's dynamic blocks declare — the document says WHAT it
// needs (via `collectDataRequirements`); this maps it in. Runs only on the
// server, so the access token never reaches the client.

export interface DirectusConfig {
  url: string
  token: string
}

export interface LoadedPage {
  id: string | number
  title: string
  document: PageDocument
  context: ResolveContext
}

interface PageRow {
  id: string | number
  title: string
  document: PageDocument
}

async function items<T>(cfg: DirectusConfig, path: string, query?: Record<string, unknown>): Promise<T> {
  const res = await $fetch<{ data: T }>(`${cfg.url}${path}`, {
    query,
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
  })
  return res.data
}

/** A media-library `AssetRef` → a concrete Directus `/assets` URL (+ transforms). */
function assetUrl(url: string, ref: AssetRef): string {
  const t = ref.transform
  const params = new URLSearchParams()
  if (t?.width)
    params.set('width', String(t.width))
  if (t?.height)
    params.set('height', String(t.height))
  if (t?.fit)
    params.set('fit', t.fit)
  if (t?.format)
    params.set('format', t.format)
  const qs = params.toString()
  return `${url}/assets/${ref.id}${qs ? `?${qs}` : ''}`
}

/** Pre-resolve every block's media asset into the serializable `assets` map. */
function collectAssets(document: PageDocument, url: string): Record<string, string> {
  const assets: Record<string, string> = {}
  const walk = (blocks: PageBlock[]) => {
    for (const block of blocks) {
      if (block.asset)
        assets[assetKey(block.asset)] = assetUrl(url, block.asset)
      if (block.children?.length)
        walk(block.children)
    }
  }
  walk(document.blocks)
  return assets
}

/** List pages for navigation. */
export async function listUframePages(cfg: DirectusConfig): Promise<Array<{ id: string | number, title: string, status?: string }>> {
  return items(cfg, '/items/uframe_pages', { fields: 'id,title,status', sort: 'id', limit: -1 })
}

/**
 * Load one page (by id, else the first) ready to render: its document merged
 * with shared globals, plus a `context` carrying the fetched collection data
 * and resolved asset URLs.
 */
export async function loadUframePage(cfg: DirectusConfig, id?: string | number): Promise<LoadedPage> {
  const page = id != null
    ? await items<PageRow>(cfg, `/items/uframe_pages/${id}`, { fields: 'id,title,document' })
    : (await items<PageRow[]>(cfg, '/items/uframe_pages', { fields: 'id,title,document', sort: 'id', limit: 1 }))[0]

  if (!page)
    throw new Error('No uframe pages found')

  // Shared globals (variables / classes / symbols) live in the uframe_globals
  // singleton; merge them in so symbol instances and tokens resolve.
  let globals: GlobalSettings | undefined
  try {
    globals = (await items<{ document: GlobalSettings }>(cfg, '/items/uframe_globals', { fields: 'document' })).document
  }
  catch {
    // No globals yet — render the document on its own.
  }
  const document = mergeGlobalsIntoDocument(page.document, globals)

  // Fetch the data each data-list / data-item block needs, keyed by block id.
  const data: Record<string, unknown> = {}
  for (const req of collectDataRequirements(document)) {
    try {
      const payload = await items<unknown>(cfg, `/items/${req.source.collection}`, {
        limit: req.kind === 'list' ? (req.source.limit ?? -1) : 1,
        sort: req.source.sort?.join(','),
        fields: '*.*',
      })
      data[req.blockId] = req.kind === 'list'
        ? (Array.isArray(payload) ? payload : [])
        : (Array.isArray(payload) ? payload[0] : payload)
    }
    catch {
      // Missing/forbidden collection → leave the block's authored fallback.
    }
  }

  const context: ResolveContext = {
    page: { id: page.id, title: page.title },
    data,
    assets: collectAssets(document, cfg.url),
  }
  return { id: page.id, title: page.title, document, context }
}
