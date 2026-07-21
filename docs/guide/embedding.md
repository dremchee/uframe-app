# Client API & protocol

`@dremchee/uframe/embed` mounts the standalone editor app into an iframe and
controls it through a typed `postMessage` protocol. It is the integration path
for any host framework.

## Create an editor

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target: document.querySelector('#editor')!,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  document: initialDocument,
  toolbarVisible: true,
  onChange: document => persistDraft(document),
  onSave: document => publish(document),
  onError: message => console.error(message),
})
```

`target` can be a container (the client creates an iframe inside it) or an
existing `<iframe>`. The returned handle is ready to use immediately; commands
issued before the iframe handshake are queued.

## Options

| Option | Type | Notes |
| --- | --- | --- |
| `target` | `HTMLElement` | Mount container or existing iframe. |
| `src` | `string` | Hosted editor `index.html`. |
| `document` | `PageDocument` | Initial single-page document. |
| `pages` / `activePageId` | `PageDocument[]` / `string` | Multi-page site and the selected page. |
| `globals` | `GlobalSettings \| null` | Shared site data for multi-page editing. |
| `readonly` | `boolean` | Hides editing affordances. |
| `toolbarVisible` | `boolean` | Shows or hides the editor toolbar. |
| `state` | `Partial<UframeEditorState>` | Initial editor state, such as viewport and preview mode. |
| `theme` | `UframeTheme` | Initial light/dark document theme. |
| `locale` / `messages` | `string` / `UframeMessages` | UI language and translation catalogs. |
| `uiTheme` / `styleTokens` | `EditorUiTheme` / `EditorStyleTokens` | Semantic editor UI styling. |
| `plugins` | `string[]` | ESM plugin URLs to load after the handshake. |
| `schema` | `NormalizedSchema` | Limits and extends the editable document schema. |
| `dataContext` | `ResolveContext` | Dynamic values available to blocks and bindings. |
| `onReady` | `() => void` | Iframe has completed its handshake. |
| `onChange` / `onSave` | `(document) => void` | Draft changes and explicit save requests. |
| `onPagesChange` / `onActivePageChange` | callbacks | Multi-page changes. |
| `onGlobalsChange` | `(globals) => void` | Shared settings changed. |
| `onStateChange` | `(state) => void` | Viewport, mode, and other public editor state changed. |
| `onRequestAsset` | callback | Editor requests an asset from the host. |
| `onError` | `(message) => void` | Recoverable protocol or editor error. |

For non-English UI, import a locale catalog separately; the base package ships
English only. See [Localization](./localization).

## Control the mounted editor

```ts
editor.setDocument(document)
editor.setPages(pages, 'home')
editor.setActivePage('pricing')
editor.setGlobals(globals)

editor.setReadonly(true)
editor.setToolbarVisible(false)
editor.setViewport('tablet')
editor.setEditBreakpoint('md')
editor.setState({ preview: true })
editor.openAddBreakpoint()

editor.setTheme('dark')
editor.setLocale('ru')
editor.setMessages({ ru: { 'toolbar.save': 'Сохранить' } })
editor.setUiTheme(uiTheme)
editor.setStyleTokens({ accent: '#14b8a6' })

editor.setSchema(schema)
editor.setDataContext({ user: { name: 'Ada' } })
editor.loadPlugins(['https://cdn.example.com/uframe/callout.js'])

editor.requestSave()
editor.destroy()
```

The underlying iframe is exposed as `editor.iframe` when host-level focus,
layout, or lifecycle work is needed.

## Supply assets from the host

The editor never needs direct access to your media API. React to an asset
request, upload or choose a file in the host UI, and send the resulting URL
back using the request ID:

```ts
const editor = createUframeEditor({
  target,
  src,
  onRequestAsset: async ({ requestId, kind }) => {
    const asset = await selectAssetInHostApp(kind)

    editor.setAsset(requestId, {
      url: asset.url,
      alt: asset.alt,
      width: asset.width,
      height: asset.height,
    })
  },
})
```

## Runtime plugins

Pass plugin module URLs on creation or load them later. The official AI plugin
is built beside the hosted editor, so it can be enabled with a stable URL:

```ts
createUframeEditor({
  target,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  plugins: ['https://uframe-app.netlify.app/embed/plugins/ai.js'],
})
```

URL-loaded plugins must share the editor runtime. Co-building them with the
embed app is the simplest option; otherwise configure a shared runtime/import
map. For authoring blocks and Vue plugins, see [Extending the editor](./extending).

## Protocol and security

The iframe emits `uframe:ready`; the client answers with `uframe:load`. Further
messages are namespaced with `uframe:` and include a protocol version.

| Host → editor | Editor → host |
| --- | --- |
| `uframe:load`, `uframe:setDocument`, `uframe:setPages`, `uframe:setActivePage`, `uframe:setGlobals`, `uframe:setState`, `uframe:setMessages`, `uframe:setSchema`, `uframe:setAsset`, `uframe:loadPlugins`, `uframe:requestSave` | `uframe:ready`, `uframe:change`, `uframe:save`, `uframe:pagesChange`, `uframe:activePageChange`, `uframe:globalsChange`, `uframe:stateChange`, `uframe:requestAsset`, `uframe:error` |

- Serve the editor from an origin you control, and allow it in your host CSP's
  `frame-src` directive.
- The client passes the host origin in the iframe URL. Both sides validate the
  window and origin before accepting messages; replies are not sent to `*`.
- `PageDocument` and `GlobalSettings` are plain structured-cloneable JSON. Treat
  untrusted document content as untrusted when rendering it outside the editor.
