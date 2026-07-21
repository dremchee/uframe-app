# Extending the editor

The [embed client](./embedding) is the right fit when you want isolation and a
tiny host bundle. When you instead need to **add your own blocks, panels, or
toolbar buttons**, import the editor as a Vue component and configure it with
props and plugins. This path pulls Vue into your bundle, so reach for it when you
own a Vue app already.

Blocks come in two flavours:

- **Vue-native** — `renderComponent` / `settingsComponent` are Vue components.
  Full integration; best for first-party blocks (most of this page).
- **Framework-neutral** — the block ships a [custom element](#framework-neutral-blocks-any-framework)
  and plain data, so it can be authored in React, Svelte, vanilla — anything that
  compiles to a custom element — and even loaded into the editor at runtime by URL.

```vue
<script setup lang="ts">
import { PageEditor } from '@dremchee/uframe'
import '@dremchee/uframe/styles.css'

const doc = ref()
</script>

<template>
  <PageEditor v-model="doc" autosave-key="my-page" @save="persist" />
</template>
```

## `<PageEditor>` props

| Prop | Type | Notes |
| --- | --- | --- |
| `v-model` | `PageDocument` | Two-way bound document. |
| `initialDocument` | `PageDocument` | Starting page when there's no model/draft. |
| `blocks` | `BlockRegistry` | Block registry; defaults to the built-ins. |
| `plugins` | `UframePlugin[]` | Bundles of blocks / tokens / panels / toolbar slots. |
| `readonly` | `boolean` | Render without editing affordances. |
| `toolbarVisible` | `boolean` | Show or hide the built-in toolbar. |
| `autosaveKey` | `string` | Shorthand for a `localStorage` storage adapter. |
| `storage` | `EditorStorageAdapter` | Custom (sync or async) `load` / `save`. |
| `prefsKey` | `string` | Namespace for UI prefs (pin / mode / panel width). |
| `features` | `EditorFeatureFlags` | Toggle `autosave` / `history` / `hotkeys` / `preview`. |
| `schema` / `dataContext` | `NormalizedSchema` / `ResolveContext` | Schema and sample data for binding and collection blocks. |
| `requestAsset` | callback | Open the host media library for an editor asset request. |
| `untrustedEmbeds` | `boolean` | Sandbox raw Embed block HTML. |
| `locale` | `string` | Active editor locale (defaults to `en`). |
| `messages` | `LocaleMessages` | Host overrides for editor-chrome translations. |
| `uiTheme` / `styleTokens` | theme objects | Semantic editor UI palettes and token overrides. |

Emits: `save` (explicit save), `error` (validation errors), `draftRestored` (an
autosave draft was loaded), and `stateChange` (public viewport, preview, theme,
and toolbar state).

`PageEditor` also supports multi-page sites with `v-model:pages`,
`v-model:active-page-id`, and `v-model:globals`. Use `v-model` for the
single-page mode. Locale catalogs are imported separately; see
[Localization](./localization).

## Feature flags

Each feature is on by default; pass `features` to turn one off:

```vue
<PageEditor :features="{ autosave: false }" />
```

| Flag | Disables when `false` |
| --- | --- |
| `autosave` | Loading and saving drafts through the storage adapter. |
| `history` | Undo / redo. |
| `hotkeys` | Editor keyboard shortcuts. |
| `preview` | The preview-mode toggle. |

The AI assistant is no longer a feature flag — it ships as the official
[`aiPlugin`](#the-ai-plugin). Add it to `plugins` to enable it.

## Custom blocks

A `BlockDefinition` describes one block type — how it renders, its settings UI,
default props, and (optionally) a schema that validates props on load:

```ts
import type { BlockDefinition } from '@dremchee/uframe'

const calloutBlock: BlockDefinition = {
  type: 'callout',
  label: 'Callout',
  category: 'Structure', // groups it in the Add panel
  icon: CalloutIcon,
  defaultProps: { tone: 'info', text: '' },
  propsSchema: calloutPropsSchema, // optional — any Standard Schema (zod 4 / valibot / arktype)
  renderComponent: CalloutBlock, // drawn on the canvas (Vue component)
  settingsComponent: CalloutSettings, // Content-tab fields (Vue component)
  acceptsChildren: false,
  css: '.callout { padding: 1rem }', // injected once into the canvas + export
  renderHtml: block => `<div class="callout">${block.props.text}</div>`, // HTML export
}
```

Pass it directly via `blocks`, or — preferably — through a plugin (below).

Notable fields:

- **`propsSchema`** — optional. Accepts any [Standard Schema](https://standardschema.dev)
  (zod 4, valibot, arktype, …); omit it for no prop validation.
- **`css`** — static stylesheet for the block type, injected once into the canvas
  iframe **and** the exported `<head>`, so `renderComponent` / `renderHtml` can use
  classes instead of inline styles. A component's own `<style>` reaches neither the
  canvas iframe nor the export, so block styles belong here.
- **`renderHtml`** — framework-free HTML string for the built-in HTML export. The
  raw-JSON + your-own-components rendering path (e.g. SSR) doesn't need it.

### Prop validation

`propsSchema` accepts **any** [Standard Schema](https://standardschema.dev), so
you're not tied to zod — use whichever validator you already have:

```ts
// ArkType
import { type } from 'arktype'

// Valibot
import * as v from 'valibot'

// zod 4
import { z } from 'zod'

const propsSchema = z.object({ tone: z.enum(['info', 'warn']), text: z.string() })
const propsSchema = v.object({ tone: v.picklist(['info', 'warn']), text: v.string() })
const propsSchema = type({ tone: '\'info\' | \'warn\'', text: 'string' })
```

The editor validates through the schema's `~standard` interface, so the library
is interchangeable. Two caveats: it's **optional** (omit for no validation), and
only **synchronous** schemas are supported (sync zod/valibot/arktype cover this).

## Plugins

A **plugin** is plain data (no lifecycle): it bundles blocks, editor-chrome style
tokens, and UI mounted into the chrome — toolbar slots, sidebar panels,
free-floating overlays, in-canvas layers, and Settings sections. Because it's
just an object, a plugin is an npm package that exports one. Use `definePlugin`
for type inference:

```ts
import { definePlugin } from '@dremchee/uframe'

export const brandPlugin = definePlugin({
  name: 'brand',
  blocks: [calloutBlock], // merged onto the registry (last-wins on a type clash)
  styleTokens: { accent: '#7c3aed' }, // recolours panels/toolbar
  toolbarSlots: { right: [SaveStatus] }, // mounted into the toolbar clusters
  panels: [{ id: 'assets', label: 'Assets', icon: AssetsIcon, component: AssetsPanel }],
})
```

Plugins can ship their own locale messages. Components mounted by the plugin
import the public `useUframeI18n()` composable from `@dremchee/uframe/vue`, just like built-in components; plugin
messages are merged by locale and host messages take precedence:

```ts
export const brandPlugin = definePlugin({
  name: 'brand',
  messages: {
    en: { brand: { assets: 'Assets' } },
    ru: { brand: { assets: 'Ассеты' } },
  },
  panels: [{
    id: 'assets',
    label: 'Assets',
    labelKey: 'brand.assets',
    icon: AssetsIcon,
    component: AssetsPanel,
  }],
})
```

Block definitions may use `labelKey`, `descriptionKey`, and `categoryKey` to
localize their entries in the block library and its search index. The plain
`label`, `description`, and `category` values remain English fallbacks.

```vue
<PageEditor :plugins="[brandPlugin]" v-model="doc" />
```

What each field does:

- **`blocks`** — block definitions merged onto the registry. Later entries win on
  a `type` collision (plugins override the base registry).
- **`styleTokens`** — prefix-free semantic overrides applied to the editor
  interface. The canvas iframe is a separate document and is intentionally
  unaffected — see [Theming](./theming).
- **`toolbarSlots`** — components appended to the toolbar's `left` / `right`
  clusters.
- **`panels`** — custom left-sidebar panels. Each adds a rail item (icon + label)
  and renders `component` when active; `id` becomes the sidebar mode key, so keep
  it stable and unique.
- **`overlays`** — free-floating layers mounted at the editor-shell root (above
  toolbar / sidebar / canvas). Each positions itself; read canvas geometry from
  the editor context's `canvas` channel to anchor within the canvas pane.
- **`canvasLayers`** — layers rendered inside the canvas overlay, in the canvas'
  coordinate space, so they scroll and clip with the frame (e.g. a highlight ring
  over the selected block). Set `canvas.busy` to suppress the built-in selection
  outline while active.
- **`settingsSections`** — sections injected into the built-in Settings panel
  (before the built-in ones). Each receives the editor instance as an `editor`
  prop.

### The AI plugin

The AI assistant — template generation & editing — ships as an official plugin
rather than a built-in feature, so hosts opt in (and it stays out of the bundle
until imported):

```ts
import { aiPlugin } from '@dremchee/uframe/plugins/ai'
```

```vue
<PageEditor :plugins="[aiPlugin]" v-model="doc" />
```

It contributes a toolbar toggle, a floating chat window (`overlays`), a
"generating" ring over the target block (`canvasLayers`), and an API-key / model
section in Settings (`settingsSections`). Config (key / base URL / model) is kept
in the editor's per-browser local prefs, never in the document. `@dremchee/uframe/plugins/ai`
also re-exports the headless `generateBlocks` helper for calling generation
directly.

## Framework-neutral blocks (any framework)

To author a block **without Vue**, provide a registered [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
instead of Vue components. The editor stays Vue internally and mounts your element;
your block can be built in React, Svelte, Lit, vanilla — anything that compiles to
a custom element.

```ts
const calloutBlock = {
  type: 'callout',
  label: 'Callout',
  category: 'Structure',
  defaultProps: { tone: 'info', text: 'Heads up!' },
  element: 'uf-callout', // a custom element you registered (customElements.define)
  settings: 'auto', // editor renders the Content form from the prop shape…
  // settings: [{ key: 'tone', type: 'select', options: [...] }, { key: 'text', type: 'textarea' }],
  css: calloutCss, // block styles (string)
  renderHtml: (block, ctx) => `<div class="${ctx.classes} callout">${ctx.escape(block.props.text)}</div>`,
}
```

- **`element`** — tag name of a custom element registered in the same realm. Used
  instead of `renderComponent`. The editor pushes block props onto it (as
  properties + primitive attribute mirrors) and applies the block's class/id.
- **`settings`** — `'auto'` infers a Content-tab form from `defaultProps`, or pass
  an explicit `SettingsField[]` (`text` / `textarea` / `number` / `boolean` /
  `select` / `color`). No Vue settings component needed. Fields and select
  options can provide `labelKey` / `placeholderKey` for plugin-owned messages.
- **`css`** / **`renderHtml`** — same as above; both framework-free.

Bundle styles with the component? They won't reach the canvas iframe or the
export, so put block styles in `css`. For the Vue starter you can lift an SFC
`<style>` into `css` at build time with the `uframe-css` Vite plugin
(`import css from './Block.vue?uframe-css'`).

### React

Mount your React component inside a custom element, then point `element` at its
tag:

```tsx
import type { Root } from 'react-dom/client'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import Callout from './Callout' // your React component

class CalloutElement extends HTMLElement {
  private root?: Root
  private props = { tone: 'info', text: 'Heads up!' }
  static observedAttributes = ['tone', 'text']
  connectedCallback() {
    this.root = createRoot(this)
    this.render()
  }

  disconnectedCallback() { this.root?.unmount() }
  attributeChangedCallback(name: string, _o: string, v: string) {
    (this.props as Record<string, unknown>)[name] = v
    this.render()
  }

  private render() { this.root?.render(createElement(Callout, this.props)) }
}
customElements.define('uf-callout-react', CalloutElement)

export default { name: 'callout-react', blocks: [{
  type: 'callout',
  label: 'Callout',
  defaultProps: { tone: 'info', text: 'Heads up!' },
  element: 'uf-callout-react',
  settings: 'auto',
  renderHtml: (b, ctx) => `<div class="${ctx.classes}">${ctx.escape(String(b.props.text))}</div>`,
}] }
```

### Svelte

Svelte 5 compiles a component straight to a custom element — no wrapper needed:

```svelte
<!-- Callout.svelte -->
<svelte:options customElement={{ tag: 'uf-callout-svelte', shadow: 'none' }} />
<script lang="ts">
  let { tone = 'info', text = 'Heads up!' } = $props()
</script>
<div class="uf-callout-block uf-callout-block--{tone}">{text}</div>
```

```ts
import './Callout.svelte' // registers <uf-callout-svelte> on import

export default { name: 'callout-svelte', blocks: [{
  type: 'callout',
  label: 'Callout',
  defaultProps: { tone: 'info', text: 'Heads up!' },
  element: 'uf-callout-svelte',
  settings: 'auto',
  css: calloutCss,
  renderHtml: (b, ctx) => `<div class="${ctx.classes}">${ctx.escape(String(b.props.text))}</div>`,
}] }
```

> Bundle React/Svelte **into** the plugin (don't externalize them) so the element
> is self-contained, and use `shadow: 'none'` for Svelte if you want the block's
> `css` (light-DOM classes) to apply. Full runnable starters for Vue, React and
> Svelte live under [`templates/`](https://github.com/dremchee/uframe-app/tree/main/templates).

### Loading plugins at runtime

A neutral plugin built to a self-contained `dist` (its custom element bundled in)
can be loaded into a hosted/embedded editor by URL — no rebuild of the editor:

```ts
createUframeEditor({ src, plugins: ['/plugins/callout/dist/index.js'] })
// or later: editor.loadPlugins(['/plugins/callout/dist/index.js'])
```

See [Client API & protocol](./embedding) for the `plugins` option and the
`loadPlugins` handle. Starter templates for Vue, React and Svelte live under
[`templates/`](https://github.com/dremchee/uframe-app/tree/main/templates).

## Storage

Supply an `EditorStorageAdapter` for full control over persistence, or
`autosaveKey` for the built-in `localStorage` adapter:

```ts
const storage: EditorStorageAdapter = {
  load: async () => fetch('/api/page').then(r => r.json()),
  save: async doc => fetch('/api/page', { method: 'PUT', body: JSON.stringify(doc) }),
}
```

```vue
<PageEditor :storage="storage" />
```

UI preferences (rail pin state, active mode, panel width) are stored separately
under `prefsKey` — never mixed with the page document. Two editors on one page
should pass distinct `prefsKey` values to keep their preferences independent.
