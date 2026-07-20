# uframe plugin starter

Standalone template for a **uframe editor plugin** written in Vue, with an
HMR playground for development and a runtime `dist` for production.

## Layout

```
src/                     plugin source
├─ CalloutBlock.vue      canvas render component
├─ CalloutSettings.vue   settings form (Content tab)
├─ schema.ts             zod props schema + shared helpers
└─ index.ts              definePlugin({ blocks: [...] })  ← entry
playground/              dev-only host that mounts the real editor
├─ App.vue               <PageEditor :plugins="[calloutPlugin]">
└─ main.ts
index.html               playground entry
vite.config.ts           DEV — serves the playground with HMR
vite.config.build.ts     BUILD — emits dist/index.js (Vue externalized)
```

## Develop (HMR)

```bash
npm install
npm run dev          # vite serves the playground at localhost
```

Editing `CalloutBlock.vue` / `CalloutSettings.vue` hot-reloads live inside the
editor — no rebuild. The plugin is wired build-time via `:plugins`, and its
source is part of the playground's Vite graph, so HMR is native.

> `uframe` is resolved from `node_modules`. Link it from your editor checkout
> (`npm link` / a workspace) for local development, or — to also HMR the editor
> internals — uncomment the `uframe` alias in `vite.config.ts`.

## Build for production

```bash
npm run build        # → dist/index.js
```

`vue`, `@vueuse/core`, `zod` and `uframe` are **external**: the plugin binds to
the editor's shared instances at runtime (never bundle a second copy of Vue).

Then register it with the editor by path at init:

```ts
createUframeEditor({
  src: '/uframe/index.html',
  plugins: ['/plugins/callout/dist/index.js'],
})
```

`dev` and `prod` differ only in wiring (`:plugins` object vs `dist` path) — the
`definePlugin(...)` object is the same.

## Notes

- **Block styles:** write them in the component's `<style>` (NOT scoped) and lift
  them into the definition's `css` field via `import css from './X.vue?uframe-css'`
  (the `uframeCss()` Vite plugin). The editor injects that string once into the
  canvas iframe AND the exported `<head>`, so the canvas component and `renderHtml`
  both use plain classes — single source of truth, no inline styles. Use CSS
  variables (`var(--x, fallback)`) for theming. Don't rely on the editor's Tailwind
  utilities — its compiled CSS won't include classes only your plugin uses.
  (Settings components can still use scoped `<style>`; they render in the editor
  chrome where `--uf-*` tokens are available.)
- **Editor context** (theme, readonly) reaches components through editor-provided
  props/CSS variables (e.g. `var(--uf-border)`), not by importing editor internals.
