# Rendering pages

The editor produces a `PageDocument` — plain JSON. To publish it you render that
document on your own frontend. `uframe/core` does this framework-agnostically:
it's **pure and synchronous**, so it works in SSR, SSG, or the browser.

> A complete, runnable reference lives in [`integrations/nuxt`](https://github.com/dremchee/uframe/tree/main/integrations/nuxt)
> — a Nuxt SSR app that renders templates from Directus.

## The pipeline

A document declares **what** data it needs; your adapter fetches it; the core
maps it in and renders:

```ts
import { defaultBlockDefinitions } from 'uframe/blocks'
import {
  collectDataRequirements,
  createBlockRegistry,
  renderDocumentToFragment,
  resolveDocument,
} from 'uframe/core'

const registry = createBlockRegistry(defaultBlockDefinitions)

// 1. What data do the document's data-list / data-item blocks need?
const requirements = collectDataRequirements(document)

// 2. Fetch it from your CMS, keyed by block id (your code).
const data = await fetchData(requirements)

// 3. Resolve bindings + expand Data Lists into a static tree.
const resolved = resolveDocument(document, { page, data, assets })

// 4. Render the static tree to HTML + its scoped CSS.
const { html, css } = renderDocumentToFragment(resolved, registry)
```

`renderDocumentToHtml(document, registry, options)` is the same thing wrapped in
a full `<!doctype html>` document (with `<title>`, `<head>` and a `baseStyles`
option) when you want one self-contained page string.

## Two ways to render

| | String HTML (`renderDocumentToFragment`) | Vue components |
| --- | --- | --- |
| Output | clean static HTML + CSS | a tree of real components |
| Client JS | none | hydration + reactivity |
| Override a block's render | no | yes |
| Best for | published, mostly-static pages | interactive / app-like pages |

The **string path** calls each block type's `renderHtml`. It's the leanest
option and emits no framework markers. The **component path** renders each
block's `renderComponent` recursively (this is what the editor canvas does); use
it when you need hydration or to swap a block type for your own component. The
Nuxt reference ships both (`UframeRenderer` and `UframeDocument`).

## Base styles

`renderHtml` and `renderComponent` rely on per-block-type base classes
(`.uf-div-block`, `.uf-paragraph-block`, …) plus a reset and design tokens. These
are **not** returned by `collectBlockCss` / `serializeDocumentStyles` — ship the
base stylesheet yourself (pass it as `renderDocumentToHtml`'s `baseStyles`, or
see `assets/page-base.ts` in the Nuxt integration). `collectBlockCss` then adds
each used block type's own `css`, and `serializeDocumentStyles` adds the
document's per-block / class / variable rules.

## Dynamic content

`resolveDocument(document, context)` is CMS-agnostic — it consumes data you've
already fetched:

- **Bindings** (`block.bindings`, e.g. `{ content: 'item.title' }`) are swapped
  against the `page` / `item` scope.
- **Data List** blocks repeat their template once per row of `context.data[id]`;
  **Data Item** blocks bind their children to a single record.
- **Assets** (`block.asset`) become `props.src` via `context.assets` (the
  serializable map) or `context.resolveAsset`.
- **Symbols / tokens** shared across pages live alongside the document; merge
  them in first with `mergeGlobalsIntoDocument(document, globals)`.

Row count, sorting and filtering belong to your fetch (the block's `source`
carries `limit` / `sort` / `filter` as intent) — the renderer just renders the
rows it's given.

## Trusted vs untrusted content

The **Embed** block renders raw author HTML. By default uframe treats a document
as **trusted** — authored by the page owner, like rich text — and inlines that
HTML verbatim (in the editor canvas, the exported string, and `PagePreview`).
The editor canvas is a *same-origin* iframe, so inlined embed HTML runs with the
editor's origin privileges (it can read the origin's `localStorage`, including a
provider key stored by the AI plugin).

If a document can carry content authored by **someone other than the page
owner** — a multi-tenant CMS, user submissions, a shared link relayed through
your host — turn on untrusted mode. Embed HTML then renders inside a **sandboxed,
cross-origin `<iframe srcdoc>`** (`sandbox="allow-scripts allow-popups
allow-forms"`, no `allow-same-origin`), isolated from the editor's origin and
storage:

```vue
// Editor
<PageEditor :untrusted-embeds="true" … />
```

```ts
// Static string / fragment
renderDocumentToHtml(document, registry, { untrustedEmbeds: true })
renderDocumentToFragment(document, registry, { untrustedEmbeds: true })
```

```vue
// Standalone preview
<PagePreview :document="doc" :untrusted-embeds="true" />
```

Trade-off: a sandboxed iframe can't auto-size to its content (it gets a default
`min-height`; size the embed block yourself), doesn't inherit the page's CSS,
and can't reach the parent — so reserve it for genuinely untrusted documents and
leave it off for the single-author case.

## Caching & performance

Resolution and rendering are pure, in-memory and cheap (sub-millisecond for
typical pages). **The cost is the network**: a page needs the document, the
shared globals, and one fetch per `data-list` / `data-item` collection. Treat the
fetch + render as cacheable work — published pages change rarely and are
read-heavy.

**1. Fetch in parallel.** Resolve the data requirements with `Promise.all`, and
fetch the page and globals together, rather than sequentially — latency drops
from the sum of round-trips to the slowest one.

**2. Cache the rendered route.** For mostly-static pages this is the big win. In
Nuxt/Nitro, stale-while-revalidate or ISR serves cached HTML with **zero CMS
calls and zero render** on a hit:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/**': { swr: 300 }, // or { isr: true } for on-demand static
  },
})
```

**3. Cache the data layer.** Wrap the CMS loader in Nitro's `defineCachedFunction`
/ `cachedEventHandler` (keyed by page id, with a TTL) so the resolved document is
reused across requests — and across collections shared by many pages.

**4. Invalidate on publish.** Point a CMS webhook (e.g. a Directus Flow) at a
`/api/revalidate?id=…` route that purges the cached entry. You get fresh content
the moment an editor publishes, and cache everywhere else.

**5. Put a CDN in front.** With ISR / correct `Cache-Control`, the rendered HTML
is served from the edge.

For caching specifically, the **string renderer** is the better fit: its output
is static HTML with no hydration state, so it caches and serves cleanly. Reach
for the component renderer only where a page genuinely needs client interactivity.
