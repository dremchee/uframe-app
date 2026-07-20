# Client API & protocol

`uframe/embed` exposes one function, `createUframeEditor`, which mounts the iframe
and drives it over a small typed `postMessage` protocol.

## `createUframeEditor(options)`

```ts
import { createUframeEditor } from 'uframe/embed'

const editor = createUframeEditor({
  target, // HTMLElement: a container (an <iframe> is created inside) or an existing <iframe>
  src, // URL of the hosted editor app (index.html)
  document, // optional initial PageDocument
  readonly, // optional, default false
  theme, // 'light' | 'dark'
  locale, // optional editor locale, defaults to 'en'
  messages, // optional editor/plugin message overrides
  uiTheme, // optional semantic light/dark editor palettes
  styleTokens, // optional prefix-free semantic overrides
  onReady, // editor mounted and handshaked
  onChange, // (document) => void — fired on edits
  onSave, // (document) => void — fired on explicit save
  onError, // (message) => void
})
```

### Options

| Option | Type | Notes |
| --- | --- | --- |
| `target` | `HTMLElement` | Where to mount. A non-`<iframe>` element is used as a **container** (an `<iframe>` is created inside it); pass an existing `<iframe>` to drive it directly. |
| `src` | `string` | URL of the hosted editor app. |
| `document` | `PageDocument` | Initial page; omitted → starts empty. |
| `readonly` | `boolean` | Render without editing affordances. |
| `theme` | `'light' \| 'dark'` | Initial theme. |
| `locale` | `string` | Initial editor UI locale. |
| `messages` | `LocaleMessages` | Host overrides for editor and plugin translations. |
| `uiTheme` | `EditorUiTheme` | Semantic `light` and `dark` editor palettes. |
| `styleTokens` | `EditorStyleTokens` | Prefix-free overrides such as `{ accent, panel, radius }`. |
| `plugins` | `string[]` | URLs of plugin ESM modules to load + register on `ready` (e.g. the official AI plugin — see below). |
| `onReady` / `onChange` / `onSave` / `onError` | callbacks | Lifecycle + data out. |

### Returned handle

```ts
editor.setDocument(doc) // replace the current document
editor.setReadonly(true) // toggle read-only
editor.setTheme('dark') // switch theme
editor.setLocale('ru') // switch editor/plugin translations
editor.setMessages({ ru: { /* host overrides */ } })
editor.setUiTheme(uiTheme) // replace both semantic palettes
editor.setStyleTokens({ accent: '#0f172a' }) // override active palette
editor.loadPlugins(['/plugins/callout/dist/index.js']) // load + register plugin dists by URL
editor.requestSave() // ask the editor to emit a `save`
editor.destroy() // remove listeners + iframe
editor.iframe // the underlying <iframe> element
```

## Plugins

Plugins load into the embed **by URL** — pass `plugins: [url]` up front or call
`editor.loadPlugins([url])` later. On `ready` the iframe dynamically imports each
module and registers its default export, so a plugin can contribute blocks *and*
UI (toolbar buttons, panels, overlays, canvas layers, Settings sections).

A URL-loaded plugin must share the editor's runtime — the same Vue instance and
the same editor-context module (its `inject` key) — or `useEditorContext()`
inside it won't resolve. The official **AI plugin** is co-built with the embed
app and served next to it (`…/embed/plugins/ai.js`), so it shares those chunks
automatically:

```ts
createUframeEditor({
  target,
  src: '/embed/index.html',
  plugins: ['/embed/plugins/ai.js'], // AI: toolbar toggle, chat window, Settings section
})
```

The provider API key the AI plugin asks for lives only in the editor's
per-browser local prefs — never in the document or its exports. To load your own
plugin this way, build it against the same uframe version and serve it so it
resolves the shared runtime (co-building alongside the embed app is the simplest
route; a shared-runtime import map is the general one).

## Protocol

The handshake: the iframe posts `uframe:ready`; the client replies with
`uframe:load` (document + options). Every message is namespaced with a `uframe:`
prefix and carries a numeric `v` (protocol version) field.

| Host → editor | Editor → host |
| --- | --- |
| `uframe:load`, `uframe:setDocument`, `uframe:setReadonly`, `uframe:setTheme`, `uframe:setUiTheme`, `uframe:setStyleTokens`, `uframe:loadPlugins`, `uframe:requestSave` | `uframe:ready`, `uframe:change`, `uframe:save`, `uframe:error` |

`PageDocument` is plain JSON, so it travels through `postMessage`'s structured
clone unchanged.

## Security

- Serve the editor app from an origin you control and pass it as `src`.
- Both sides validate the message `origin` and `source`; the host origin is
  passed to the iframe on its URL so replies are targeted, never `*`.
- Allow framing that origin in your host's CSP (`frame-src`).
