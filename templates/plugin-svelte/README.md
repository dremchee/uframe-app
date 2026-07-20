# uframe plugin — Svelte example

A Callout block authored in **Svelte 5**, compiled to a self-contained **custom
element** via `<svelte:options customElement="uf-callout-svelte" />`. The editor
mounts `<uf-callout-svelte>` and never sees Svelte.

> Targets the **planned** neutral contract (see
> [plugin-sdk-plan.md](../../../docs/plans/plugin-sdk-plan.md)). Editor
> integration is forward-looking; the custom element runs standalone today.

## Layout

```
src/
├─ Callout.svelte   component with customElement option (display-only)
└─ index.ts         imports the component (auto-registers) + neutral plugin
playground/          standalone host (no editor) for developing the element
index.html
```

## Develop (HMR, standalone)

```bash
npm install
npm run dev          # renders <uf-callout-svelte> on a blank page with HMR
```

## Build

```bash
npm run build        # → dist/index.js  (Svelte runtime bundled; only uframe external)
```

Loaded by the editor at init (planned neutral contract):

```ts
createUframeEditor({ src: '/uframe/index.html', plugins: ['/plugins/callout-svelte/dist/index.js'] })
```

## Notes

- Svelte's `customElement` compiler option does the framework→web-component
  bridge for you — no wrapper class (compare `register.tsx` in the React example).
- Self-contained: the Svelte runtime is bundled in; no shared-framework needed.
- **`shadow: 'none'`** — keeps the element in light DOM so the block's CSS (from
  the co-located `callout.css`, set on the `css` field) applies by class. Default
  shadow DOM would block those document-level rules and force styles inside the
  component, breaking the single source of truth.
- **Styles in `callout.css`** (imported via `?inline`) — single source of truth;
  the editor injects it into the canvas + export, the standalone playground injects
  the same string.
- `propsSchema` omitted (optional under the neutral contract); add a Standard
  Schema only if you want prop validation.
