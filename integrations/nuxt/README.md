# uframe — Nuxt SSR frontend

A minimal [Nuxt](https://nuxt.com) app that renders uframe **templates**
(`PageDocument`s authored in the editor) server-side. It does not bundle the
editor — only the rendering path.

## How it renders

Everything heavy already lives in `uframe/core`; this app is a thin shell:

1. **`collectDataRequirements(document)`** — lists the data each `data-list` /
   `data-item` block needs (keyed by block id).
2. **`resolveDocument(document, context)`** — swaps bound props in and expands
   Data Lists once per row into a static tree.
3. **`renderDocumentToFragment(resolved, registry)`** — turns that tree into
   clean HTML + its scoped CSS (the same output as the editor's HTML export).

Pure and synchronous, so SSR output and client hydration always match.

## Two renderers

Both take `document` + optional `context` and inject the page CSS via `useHead`:

- **`<UframeRenderer>`** — strings each block's `renderHtml` into one `v-html`
  payload. Zero client JS, cleanest published markup (no placeholders). Best
  default for static published pages.
- **`<UframeDocument>`** — walks the tree with recursive `<UframeBlock>`s, each
  rendered through its real Vue `renderComponent`. Hydrates, stays reactive, and
  accepts a `components` map to **override any block type with your own
  component**:

  ```vue
  <UframeDocument :document="doc" :context="ctx" :components="{ button: MyButton }" />
  ```

  Mirrors the editor's preview semantics (an empty, unstyled container shows a
  "drop blocks" hint — give it children/a box, or use `<UframeRenderer>` for
  zero-chrome output).

## Components / pieces

| File | Role |
| --- | --- |
| `components/UframeRenderer.vue` | String-HTML renderer — `renderHtml` → `v-html`, CSS via `useHead`. |
| `components/UframeDocument.vue` | Component renderer — recursive `<UframeBlock>`s + per-type `components` overrides. |
| `components/UframeBlock.vue` | Recursive single-block renderer (bindings / Data List / symbols resolved inline); production sibling of the editor's `CanvasBlockRenderer`. |
| `composables/useUframeRegistry.ts` | Builds the default block registry (`uframe/blocks`) once and shares it. |
| `composables/useUframePage.ts` | UI seam: loads a page via `/api/uframe-page`. |
| `server/utils/directus.ts` | Directus adapter — fetches the page template, merges globals, fetches the data its blocks need, resolves asset URLs (server-only token). |
| `server/api/uframe-page.get.ts`, `uframe-pages.get.ts` | API routes wrapping the adapter; fall back to the sample when Directus isn't configured. |
| `assets/page-base.ts` | The page base stylesheet (reset + tokens + per-block-type base classes) the rendered output relies on. |
| `data/sample-document.ts` | A bundled sample template + the data its bindings need (the fallback). |

## Run

```bash
pnpm install
pnpm --filter uframe-frontend-nuxt dev
```

Open http://localhost:3000. With no Directus configured it renders the bundled
**sample** (static hero + a data-bound posts list), proving the pipeline.

## Connect to Directus

Set two env vars and the API routes switch to the live `uframe_pages` store:

```bash
NUXT_PUBLIC_DIRECTUS_URL=http://localhost:8055 \
NUXT_DIRECTUS_TOKEN=<a-directus-static-token> \
pnpm --filter uframe-frontend-nuxt dev
```

- **`NUXT_PUBLIC_DIRECTUS_URL`** — your Directus base URL.
- **`NUXT_DIRECTUS_TOKEN`** — *optional.* A [static access token](https://docs.directus.io/reference/authentication.html#static-tokens),
  read server-side only and never sent to the browser. Omit it if the relevant
  collections are public-readable (below).

Whether via token or the public role, **read** access is needed on:

| Collection | Why |
| --- | --- |
| `uframe_pages` | The page template itself — **required**. |
| `uframe_globals` | Shared symbols / tokens — needed for pages that use components. |
| your content collections (e.g. `blog`, `home`) | Whatever the `data-list` / `data-item` blocks bind to. |

> Settings → Roles → Public → grant Read on those collections (or use a token
> for a role that can).

The index then lists the real pages; each `/<id>` route renders that page
server-side: the document is merged with the `uframe_globals` singleton
(symbols / tokens), its `data-list` / `data-item` blocks are filled from the
collections they bind to, and media `AssetRef`s become `/assets` URLs — all in
`server/utils/directus.ts`.
