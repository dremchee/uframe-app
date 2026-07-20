# uframe plugin — React example

A Callout block authored in **React**, compiled to a self-contained **custom
element**. Demonstrates the framework-neutral plugin contract: the editor mounts
`<uf-callout-react>` and never sees React.

> Targets the **planned** neutral contract (see
> [plugin-sdk-plan.md](../../../docs/plans/plugin-sdk-plan.md)). The editor's
> neutral host (`<NeutralBlockHost>`, runtime `register()`) isn't implemented
> yet, so editor integration is forward-looking — but the custom element itself
> develops and runs standalone today.

## Layout

```
src/
├─ Callout.tsx     React component (display-only)
├─ register.tsx    custom-element wrapper → defines <uf-callout-react>
├─ shared.ts       props type + tone→color (used by component AND renderHtml)
└─ index.ts        neutral plugin: { element, settings:'auto', renderHtml }
playground/         standalone host (no editor) for developing the element
index.html
```

## Develop (HMR, standalone)

```bash
npm install
npm run dev          # renders <uf-callout-react> on a blank page with HMR
```

## Build

```bash
npm run build        # → dist/index.js  (React bundled in; only uframe external)
```

The editor will load it by path at init (planned neutral contract):

```ts
createUframeEditor({ src: '/uframe/index.html', plugins: ['/plugins/callout-react/dist/index.js'] })
```

## Notes

- **React is bundled in** — a web-component plugin must be self-contained; there
  is no shared-framework requirement (unlike a Vue-native plugin).
- **No zod here** — `propsSchema` is optional under the neutral contract. Add a
  Standard Schema (zod/valibot/arktype) only if you want prop validation.
- **Styles in `callout.css`** (co-located), imported as a string via
  `?inline` and set on the `css` field — single source of truth. The editor
  injects it into the canvas + export; the standalone playground injects the same
  string. The element renders into light DOM, so document-level class rules (and
  `var(--callout-*)` overrides) apply. Component renders classes, no inline styles.
- Block render is display-only; editing is the editor's schema-driven settings
  (the `settings` field — `'auto'` to infer fields, or an explicit list as here).
