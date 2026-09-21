# uframe — Astro frontend

A runnable Astro integration for rendering `PageDocument` JSON with the existing
uframe HTML renderer. It supports static generation and on-demand server rendering.
No Vue integration or client hydration is required.

## Run

From the repository root (`app/`):

```sh
pnpm install
pnpm build:lib
pnpm --filter uframe-frontend-astro dev
```

The bundled sample renders page bindings and a repeated Data List without a CMS.
Use `pnpm --filter uframe-frontend-astro test` to build it and verify the output.

## Use in an Astro project

Add these SSR bundling rules to your `astro.config.mjs` (the example already
includes them). The standard block registry also contains editor components;
Vite must resolve their Atlaskit dependencies rather than leaving directory
imports to Node:

```js
import { defineConfig } from 'astro/config'

export default defineConfig({
  vite: {
    resolve: { noExternal: ['@dremchee/uframe', /^@atlaskit\//] },
  },
})
```

```astro
---
import UframePage from '@dremchee/uframe/astro'
import { document, context } from '../data/page'
---

<UframePage document={document} context={context} lang="en">
  <meta slot="head" name="description" content="My published page" />
</UframePage>
```

`UframePage` is a full HTML document, so use it as the page layout. It resolves
bindings, Data Lists and assets, renders blocks through `renderHtml`, and includes
the page reset, block/document CSS and font stylesheet links in `<head>`.
The named `head` slot accepts metadata; the default slot appends content to the body.

| Prop | Purpose |
| --- | --- |
| `document` | Required `PageDocument`. |
| `context` | Optional `ResolveContext` with fetched page/data/assets. |
| `registry` | Custom block registry; defaults to uframe's standard blocks plus the Data plugin. Custom blocks need `renderHtml`. |
| `lang` | HTML language, default `en`. |
| `title` | Override the document title. |
| `baseStyles` | Replace the default reset, or use `""` to omit it. |
| `untrustedEmbeds` | Isolate Embed HTML using the core renderer's sandbox mode. Default `false`, matching other renderers. |

## CMS data and routes

Fetch the document in an Astro page's frontmatter. Merge shared symbols/tokens
with `mergeGlobalsIntoDocument` first, call `collectDataRequirements(document)`
from `@dremchee/uframe/plugins/data`,
then fetch each requirement and pass records in `context.data`, keyed by block ID.
The component uses `resolveDataDocument` from the Data plugin to expand lists
and resolve bindings/assets. It does not fetch data or expose CMS credentials
to the browser.

For static routes such as `src/pages/[slug].astro`, return each document and its
context through `getStaticPaths()` props. The data is rendered at build time.
For SSR, configure an [Astro adapter](https://docs.astro.build/en/guides/on-demand-rendering/)
and use `export const prerender = false` on the route; fetch the document using
`Astro.params` in frontmatter. The same component renders at request time.

For an existing layout that only needs a fragment, use
`resolveDocument` + `renderDocumentToFragment` from `@dremchee/uframe/core`, put
its CSS in `<style is:inline set:html={css} />`, and its HTML in
`<Fragment set:html={html} />`. Include `exportBaseStyles` and font links in your
layout as needed. See [Astro template directives](https://docs.astro.build/en/reference/directives-reference/).
