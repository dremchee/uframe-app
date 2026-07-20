# Integrations

uframe ships reference integrations under
[`integrations/`](https://github.com/dremchee/uframe/tree/main/integrations) —
prebuilt ways to slot the editor into a CMS and to render its output on a
frontend. They're deliberately thin: the only contract is the `PageDocument`
JSON, plus [`uframe/embed`](./embedding) on the authoring side and
[`uframe/core`](./rendering) on the rendering side.

They split into two roles:

- **Author & store** — embed the editor in a CMS and persist the `PageDocument`.
- **Render & publish** — read the stored document and render it on a frontend.

| Integration | Role | Stack | Status |
| --- | --- | --- | --- |
| [Directus extension](https://github.com/dremchee/uframe/tree/main/integrations/directus) | Author & store | Directus 11 | Available |
| [Nuxt frontend](https://github.com/dremchee/uframe/tree/main/integrations/nuxt) | Render & publish | Nuxt 3 | Available |
| [Strapi plugin](https://github.com/dremchee/uframe/tree/main/integrations/strapi) | Author & store | Strapi (React) | Planned |

## Directus extension

`directus-extension-uframe` is a Directus **bundle** with three entries:

- **module** — a zero-config page manager in the left bar. On first run it
  creates two hidden collections it owns: `uframe_pages` (your pages, with a
  `document` JSON field) and `uframe_globals` (a singleton of site-wide
  variables / breakpoints / classes / symbols).
- **interface** — a custom interface for any JSON field, if you prefer pages as a
  normal, visible collection. The editor's Save writes the document back.
- **endpoint** — serves the bundled embed app at `/uframe/index.html`, so the
  iframe loads same-origin with no external hosting.

The editor runs isolated in an `<iframe>` via `uframe/embed`; Directus owns the
page list, permissions, revisions and draft/publish. Your frontend reads the raw
`PageDocument` over the items API (`GET /items/uframe_pages/:id` and
`GET /items/uframe_globals`). See the
[extension README](https://github.com/dremchee/uframe/tree/main/integrations/directus).

## Nuxt frontend

`uframe-frontend-nuxt` is an SSR app that **renders** stored templates. It pulls
a page from Directus (`uframe_pages`), merges the `uframe_globals` singleton,
fills `data-list` / `data-item` blocks from their collections, and renders with
the core pipeline — falling back to a bundled sample when no CMS is configured,
so it runs out of the box.

It ships both renderers described in [Rendering pages](./rendering): a string
`renderHtml` path and a recursive Vue-component path (with per-type overrides).
The data access (token optional / public read) lives in a server route, so the
caching recommendations from that guide apply directly. See the
[frontend README](https://github.com/dremchee/uframe/tree/main/integrations/nuxt).

## Strapi plugin (planned)

`strapi-plugin-uframe` will be a Strapi custom-field plugin. Strapi's admin is
React, so the field is a thin React wrapper around the same `uframe/embed` iframe
client the Directus extension uses, storing a `PageDocument` as a JSON custom
field. The embed-delivery model (bundle the built editor app, serve it locally)
is shared. Status: **scaffold pending.**

## Build your own

There's nothing special about these — the integration surface is small:

- **Authoring host** (any stack): mount `createUframeEditor` from `uframe/embed`
  and persist the `PageDocument` JSON it emits. See [Client API & protocol](./embedding).
- **Frontend** (any stack, SSR/SSG/CSR): feed the stored document through
  `resolveDocument` + `renderDocumentToHtml` / `renderDocumentToFragment` from
  `uframe/core`. See [Rendering pages](./rendering).

Because both sides speak plain JSON, an integration is mostly glue: where the
document is stored, and how the data its bindings need is fetched.
