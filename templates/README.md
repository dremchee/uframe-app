# uframe plugin templates

Starter templates for writing editor plugins. Same **Callout** block in each, so
you can compare the authoring styles.

| Template | Stack | Contract | Status |
|---|---|---|---|
| [plugin-vue/](./plugin-vue/) | Vue 3 SFC | **Vue-native** (`renderComponent` / `settingsComponent`) | works against the current editor (`:plugins`, build-time) |
| [plugin-react/](./plugin-react/) | React 19 → custom element | **neutral** (`element` + `settings:'auto'`) | targets the planned neutral contract |
| [plugin-svelte/](./plugin-svelte/) | Svelte 5 → custom element | **neutral** | targets the planned neutral contract |

## Two contracts

- **Vue-native** — full integration, fast path for first-party plugins. Compiled
  into the editor build, registered via `<PageEditor :plugins="[...]" />`.
- **Neutral (web components)** — write the block in any framework (or vanilla),
  compile to a self-contained custom element, ship a `dist`, and the editor loads
  it by path. No Vue, no shared-framework requirement. This is the primary public
  contract — see [plugin-sdk-plan.md](../../docs/plans/plugin-sdk-plan.md).

> The neutral examples (React/Svelte) target the **planned** contract: the
> editor's neutral host (`<NeutralBlockHost>`, runtime `register()`) is not
> implemented yet. The custom elements themselves develop and run standalone
> today via each template's playground.
