# Getting started

uframe is a block-based page editor. You run it as a standalone **iframe app**
and drive it from your host page with the framework-agnostic client
`uframe/embed` — no framework lock-in, nothing heavy in your bundle.

## Install

```bash
pnpm add uframe
```

The host client (`uframe/embed`) is plain DOM + `postMessage` — it has **no peer
dependencies** and works in any stack (React, Vue, Svelte, or no framework).

## 1. Host the editor app

The editor ships as a static app. Build it and serve the output anywhere static
(a CDN, your own server, GitHub Pages):

```bash
pnpm build:embed   # → embed-dist/
```

You'll point the client at its `index.html` URL.

## 2. Mount it

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target: document.getElementById('editor')!, // a container element
  src: 'https://cdn.example.com/uframe/index.html',
  document: myDocument, // optional initial page
  onSave: doc => fetch('/api/page', {
    method: 'PUT',
    body: JSON.stringify(doc),
  }),
})
```

That's it — a full editor, isolated inside the iframe, talking to your page over
a typed message channel.

Next: what the editor can do on the [canvas](./editing), the full
[client API and protocol](./embedding), or [theming](./theming).

## Embed or import?

This guide covers the **embed** path — the editor as an iframe app, driven over
the tiny `uframe/embed` client. If you need custom blocks, plugins, or panels,
[import the Vue component](./extending) instead. The [overview](./overview#two-ways-to-integrate)
compares the two side by side.
