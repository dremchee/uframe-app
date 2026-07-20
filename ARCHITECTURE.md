# Architecture

`uframe` is an **embeddable Vue 3 page editor**, shipped as a library
(`src/index.ts`) and exercised by a local playground (`playground/`). It lets a
host app render an editable canvas where users compose a page from a registry of
blocks, extract reusable **components (symbols)** with variants, edit styles, and
serialize the result to JSON/HTML.

## Tech stack

- **Vue 3** (Composition API, `<script setup>`, TypeScript) — `vue-tsc` for types.
- **Tailwind CSS v4** (CSS-first, no `tailwind.config.*`) via `@tailwindcss/vite`.
- **reka-ui** primitives + **class-variance-authority / clsx / tailwind-merge**
  (`cn` in `src/lib/utils.ts`) for the shadcn-vue component library.
- **@vueuse/core** — `useEventListener`, `useResizeObserver`, `useLocalStorage`,
  `useThrottleFn`, `useDebounceFn`, `onClickOutside`, … (composables glue).
- **zod** for runtime document/prop validation.
- **@atlaskit/pragmatic-drag-and-drop** for canvas/tree/library drag-and-drop.
- **@tiptap** for rich-text editing.
- **Vitest** (unit tests), **tsdown** (library build), **Vite** (playground build).

## Layered structure

```
src/
  core/        framework-agnostic domain: schemas, types, tree/style/HTML utils
  blocks/      built-in block definitions + the default registry
  components/  shadcn-vue design system (components/ui/*)
  lib/         cn() utility
  vue/         the editor itself: composables, context, components
  styles/      editor.css (foundation) + page-frame.css (iframe content CSS)
```

Dependency direction is strictly **`core` ← `blocks` ← `vue`**; `core` imports
nothing from Vue components. `components/ui` is a standalone design system the
`vue/` editor consumes.

### Entry points & builds

- Library: `src/index.ts` re-exports `blocks`, `components/ui`, `core`, `vue`.
- `npm run build:lib` = `tsdown` (JS/d.ts) **+ Tailwind CLI compiling
  `src/styles/editor.css` → `dist/styles.css`** (flattened, self-contained —
  imports resolved, used utilities generated).
- Playground: `playground/main.ts` → `playground/App.vue` (imports
  `../src/styles/editor.css`); `npm run build:playground` → `playground-dist/`
  (`build.outDir` in [vite.config.ts](../vite.config.ts)).

## Core domain model (`src/core`)

- **`PageDocument`** ([schemas/page-document.schema.ts](../src/core/schemas/page-document.schema.ts)):
  `{ id, blocks: PageBlock[], styles, symbols, settings, updatedAt, ... }`,
  zod-validated. `safeParsePageDocument` / `serializePageDocument` guard the
  boundaries.
- **`PageBlock`** — a recursive tree node `{ id, type, props, children?, style?,
  classes? }`. Tree operations live in
  [utils/document-tree.ts](../src/core/utils/document-tree.ts) (`findBlock`,
  `updateBlockInTree`, `removeBlockFromTree`, `moveBlockTo`,
  `cloneBlockWithNewIds`, …) and are **pure/immutable**.
- **Styles** — named classes + per-block inline styles; `serializeDocumentStyles`
  ([utils/styles.ts](../src/core/utils/styles.ts)) turns them into a stylesheet.
  Combo keys (`isComboKey`, `normalizeComboKey`) support state/viewport variants.
  `BaseBlockStyles` ([types/block-styles.ts](../src/core/types/block-styles.ts))
  covers layout (flex **and** CSS grid — `gridTemplate{Columns,Rows}`,
  `gridAutoFlow`, row/column gap, item placement `gridColumn`/`gridRow`/`*Self`),
  spacing, size, typography, background, border, effects, plus per-state
  (`states`) and per-breakpoint (`responsive`) layers. The serializer is generic
  (camelCase → kebab), so new CSS properties need only a type + zod-schema entry.
  [utils/grid-template.ts](../src/core/utils/grid-template.ts) parses/serializes a
  track list (`gridTemplateColumns` ↔ `GridTrack[]`) for the track editors.
- **Custom properties & breakpoints** — `document.variables: CssVariable[]`
  (user-defined `:root` vars, emitted by `serializeVariables`) and
  `document.settings.breakpoints` (fully user-defined responsive breakpoints,
  [utils/breakpoints.ts](../src/core/utils/breakpoints.ts)). Both are
  document-owned, so they round-trip through serialization.
- **Symbols (components)** — `SymbolDefinition { id, name, root: PageBlock,
  variants?, defaultVariantId?, properties? }`. Instances are blocks of type
  `SYMBOL_INSTANCE_BLOCK_TYPE` referencing a symbol id + optional variant id.
  Public property definitions map stable instance keys to inner block props.
  Component-only named `slot` blocks expose instance-owned child trees through
  internal `SYMBOL_SLOT_FILL_BLOCK_TYPE` wrappers.
- **Serialization/storage** — `serialization.ts`, `storage.ts`
  (`createLocalStorageAdapter`), `html.ts` (HTML export).

## Block registry (`src/blocks`)

A **`BlockDefinition`** ([core/types/block-registry.ts](../src/core/types/block-registry.ts))
describes a block type: `type`, `label`, `defaultProps`, `propsSchema` (zod),
`renderComponent` (canvas), `settingsComponent` (properties panel), `icon`,
`acceptsChildren`, `category` (Add-panel grouping), optional `renderHtml`.
Built-ins span structure (section, container, div, divider, spacer), typography
(heading, paragraph, text, list, list-item, link), media (image, embed) and
forms (form, label, input, text-area, checkbox, radio, select, select-option) —
each a folder with `*Block.vue` + `*Settings.vue`.
[registry.ts](../src/blocks/registry.ts) assembles `defaultBlockDefinitions`;
the registry is a `Record<type, BlockDefinition>` and is **injectable**, so
hosts can add/replace block types (directly or via plugins).

## Editor state — `usePageEditor` ([vue/composables/editor/usePageEditor.ts](../src/vue/composables/editor/usePageEditor.ts))

The single source of truth. Key state is held in **`shallowRef`s** (`document`,
`registry`, `selectedBlockId`, `editingSymbolId`, `isPreviewMode`, `viewport`,
`customWidth`, `hoveredBlockId` + `hoverSource` + `syncedHoverId`,
`spacingOverlay`, `errors`).

- **`commit(next, trackHistory=true)`** is the one mutation chokepoint: it pushes
  history, then **reassigns `document.value`** with a fresh object and a new
  `updatedAt`. Every editing action (add/insert/update/move/remove blocks, style
  and class ops, symbol/variant ops) routes through `commit`.
- Because `document` is a `shallowRef` reassigned on each commit, **watchers
  observe it by reference**, not via `deep`/`updatedAt`-string (the latter
  dropped renders when commits shared a millisecond — see the canvas/stylesheet
  watchers).
- **History** ([useEditorHistory.ts](../src/vue/composables/editor/useEditorHistory.ts))
  — undo/redo stacks of document snapshots.
- **Symbol editing** — `enterSymbolEdit` snapshots the page, swaps
  `document.blocks` for `[symbol.root]` (so all tree mutations "just work"),
  runs an isolated history; `exitSymbolEdit` merges the edited root back into the
  symbol and restores the page snapshot.
- **Viewport / breakpoint** — `viewport` (`responsive`/`desktop`/`tablet`/
  `mobile`) plus an optional `customWidth` drives `canvasWidth`. The toolbar
  viewport doubles as the edited style layer via `editBreakpoint`
  (`tablet`/`mobile` → matching responsive override; `responsive`/`desktop` →
  `base`).
- **Hover sync** — `setHoveredBlock(id, source)` updates `hoveredBlockId`
  immediately for the surface you're pointing at and mirrors it on a 60 ms
  throttle into `syncedHoverId` for the *other* surface (tree ↔ canvas). The
  source side reads `hoveredBlockId`, the mirror side reads `syncedHoverId` —
  no flicker, no perceptible lag.
- **`spacingOverlay`** — `{ group: 'margin' | 'padding', side: 'Top' | …}` set
  while a SpacingField is open or being scrub-dragged; CanvasViewport renders
  DevTools-style margin/padding bands around the selected block driven by it.
- Public API includes block CRUD, class/style ops, symbol+variant ops,
  `load`, `undo`/`redo`, `serialize`.

Supporting composables: `useAutosave` (debounced persistence via a storage
adapter), `useEditorHotkeys`, `useBlockStylesheet` (adopts a `CSSStyleSheet`
into a target document), `useSidebar` (the left rail + panel controller, see
below), `createEditorStorage` (see [Editor preferences](#editor-preferences)),
the `useBlockCardDraggable` / `useSymbolCardDraggable` / `useTreeNodeDnd` DnD
glue, and the canvas-overlay composables:

- **`useCanvasOverlays`** — measures the selected block against the iframe:
  `selectionRect`, `hoverRect`, `spacingBox`, `gridBox` (resolved grid tracks),
  `flexBox` (flex item geometry). Owns the recompute plumbing (resize/scroll/
  `ResizeObserver` + a rAF loop during spacing edits).
- **`useCanvasGrid`** — grid/flex layout overlay built on `gridBox`/`flexBox`:
  track guide lines, drag-to-resize handles (splitter-style — the two tracks
  either side of a boundary grow/shrink by the same delta, each unit-preserving
  and clamped) and gap grips that resize the shared column/row gap. Base-layer
  only.
- **`useCanvasDropOverlay`** / **`useCanvasHitTest`** / **`useCanvasBlockLabels`**
  — DnD drop indicator, pointer hit-testing, and block label/icon resolution.

### Transient commits

`beginTransient()` / `endTransient()` open a window during which `commit()`
updates `document.value` but skips `history.push`. `beginTransient` itself
pushes one snapshot of the pre-gesture state, so the gesture collapses into a
single undoable entry. The SpacingField scrub-drag uses this — without it,
`useThrottleFn(16)` style commits would push ~60 entries per second of drag.

## Component composition (`src/vue/components`)

`PageEditor.vue` is the public root: it resolves the initial document
(props/model/autosave draft), instantiates `usePageEditor`, wires autosave +
hotkeys, and **`provide`s** a `PageEditorContext`
([context/editor-context.ts](../src/vue/context/editor-context.ts)). Everything
below consumes it via `useEditorContext()` — no prop-drilling.

```
PageEditor (provides context + pluginSlots)
└─ EditorShell           applies plugin styleTokens to the .uf-editor root
   ├─ EditorToolbar      undo/redo, viewport switcher, theme/preview/export/save
   │                     + plugin toolbar slots (left / right clusters)
   ├─ SidebarRail        Webflow-style icon column: Add / Layers / Components
   │                     / Variables / Classes / Settings + plugin panels + pin
   ├─ SidebarPanels      docked column (pushes canvas) OR floating flyout
   │                     (overlays canvas, dismissed on blur)
   │   ├─ BlockLibraryPanel    Block + Symbol library cards (drag source)
   │   ├─ PageTreePanel / Row  keyboard-navigable ARIA tree with DnD
   │   ├─ ComponentsPanel      saved-component management
   │   ├─ VariablesPanel / ClassesPanel / SettingsPanel
   │   └─ <plugin panel>       custom panel mounted by id (see Extension points)
   ├─ CanvasViewport     iframe host + selection / hover / spacing / grid overlay
   ├─ PropertiesPanel    Content / Style tabs, classes, symbol + variant UI,
   │                     save/rename component dialogs (Dialog modal)
   └─ CssPreviewPanel    bottom drawer with computed-CSS preview
```

The style panel decomposes into [style-panel/](../src/vue/components/style-panel):
`StylePanel` (sections), `StyleSection` (chevron-disclosed), `StyleVariantSelector`,
`StyleField`, `SpacingControl` + `SpacingField` (margin/padding with scrub-drag),
`PositionControl`, `BorderControl`, `GridControl` (column/row track editors, gap
with a link/split toggle, auto-flow + alignment) and `GridItemControl` (shown
when the parent is a grid), and `BindableField` (binds a value to a `var()`).
Numeric values use the `SizeInput` UI primitive (number + unit dropdown).

**Gap is unified** across flex and grid: the fields read the *effective* value
(`gap` shorthand ?? `row`/`columnGap` longhands) and normalise on write — `gap`
when row == column, longhands when they differ — so switching `display` never
desyncs the gap.

### Tree keyboard navigation

`PageTreePanel` follows the WAI-ARIA tree pattern. Because the row list is
virtualised, DOM focus stays on the container and the active row is tracked via
`aria-activedescendant`; pure navigation helpers live in
[core/utils/tree-nav.ts](../src/core/utils/tree-nav.ts) (`resolveTreeKey`, …,
unit-tested). Arrow keys move/expand/collapse, Home/End jump, Enter/Space select
(selection follows focus), Alt+↑/↓ reorder, Cmd/Ctrl+D duplicates; deletion is
left to the global Delete/Backspace hotkey.

### Canvas rendering model

The canvas is an **`<iframe>`** for style isolation. `CanvasViewport.vue`:

1. Bootstraps the iframe document and injects `pageFrameStyles` — the
   [page-frame.css](../src/styles/page-frame.css) stylesheet for *rendered page
   content*, imported as a raw string by [page-frame.ts](../src/styles/page-frame.ts)
   (`?raw`) and independent of the editor chrome stylesheet.
2. Manually `render()`s a `CanvasFrameDocument` vnode into the iframe body and
   re-renders when `document.value` changes (reference watch).
3. `CanvasFrameDocument` adopts the document stylesheet (`useBlockStylesheet`)
   and renders `CanvasBlockRenderer` per block.
4. `CanvasBlockRenderer` resolves the `renderComponent` from the registry;
   symbol instances render the resolved variant root non-interactively (the
   `interactive` prop defaults to `true` via `withDefaults` — Vue's Boolean
   prop casting would otherwise coerce an omitted prop to `false` and silently
   strip `data-block-id` / click handlers).
5. **Selection/hover outlines + name badges are drawn by an overlay in the main
   window** (measured against iframe elements via `useCanvasOverlays`), not
   inside the iframe. Selected gets a 2 px accent outline + accent-coloured
   badge (the badge doubles as a drag handle that reorders the block); hovered
   gets a 1 px gray outline + gray badge. Hover is suppressed when it equals the
   selection (avoids dueling outlines) and during DnD.
6. **Spacing overlay** — while `editor.spacingOverlay` is set, the overlay
   renders four margin bands (orange) and four padding bands (green) measured
   from `getComputedStyle` on the selected element, with the active edge
   labelled by a px badge tinted to its band.
7. **Grid / flex overlay** (`useCanvasGrid`) — when the selected block is a grid,
   dashed track guide lines + a content-box outline are drawn, with drag handles
   on the internal track boundaries. A handle is a **splitter**: it grows the
   track on one side and shrinks the track on the other by the same delta
   (`resizeAdjacentTracks`), so the rest of the grid stays put; each track keeps
   its own unit (fr/%/px/rem/em), clamped to sane ranges. When it's a flex
   container, gap
   grips sit between the measured item boxes. A grip resizes the shared column/
   row gap; the gap band lights up while a grip is hovered or dragged. All of
   this edits the **base** style layer only.
8. **Reactivity to live size edits**:
   - PropertiesPanel emits style updates via `useThrottleFn(16ms, leading +
     trailing)` rather than a debounce, so the iframe reflows each frame while
     a SpacingField is being scrub-dragged.
   - A `ResizeObserver` (created inside the iframe `Window`) watches the
     selected block's border-box → padding / width / height edits reposition
     overlays immediately.
   - While `spacingOverlay` is set, a `requestAnimationFrame` loop also
     recomputes the overlays — margin-only edits move the block without
     resizing it, so `ResizeObserver` on the block itself wouldn't see them.
   - `renderFrame` recomputes overlays on a rAF pass (not just `nextTick`) so a
     layout-only change that doesn't resize the block (e.g. `display:block→flex`)
     isn't measured before the iframe stylesheet has applied.
9. **Event plumbing** uses VueUse `useEventListener`: the iframe `document` and
   `window` are tracked via a `shallowRef` updated inside `bootstrapFrame`,
   because `iframe.contentDocument` isn't a reactive Vue property and
   `doc.open()/close()` swaps the document object. Auto-cleanup on unmount.

## Symbols / components

Master tree + instances kept in sync. `saveBlockAsSymbol` extracts a subtree;
`insertSymbolInstance`/`addSymbolInstance` place references; `detachSymbolInstance`
clones a master back into an independent tree; variants
(`createSymbolVariant`/`setInstanceVariant`/…) layer class overrides on the root.
Components carry a distinct **violet identity color** (`--color-uf-symbol`) in the
tree, library, and properties.

`materializeSymbolInstance` is the shared resolution boundary for Canvas, static
HTML, Nuxt, and detach. It selects the active variant, applies public prop values
and bindings, then replaces each named master Slot with an instance fill or its
fallback children. Slot fills are stored under the instance so they survive
master updates; fill children remain interactive while the master subtree stays
locked. Component-only block availability is enforced by the registry/UI and by
editor commands, and validation rejects Slot blocks in normal page trees plus
duplicate names inside a component.

## Styling architecture (`src/styles/editor.css`)

Deliberately **isolated**: it imports only `tailwindcss/theme.css` +
`tailwindcss/utilities.css` (plus `tw-animate-css`) — **no global Tailwind
preflight**, so the embedded editor never leaks resets into the host app. A
hand-written reset is scoped under `.uf-editor` (and the portal roots
`.uf-dialog-content` / `.uf-ui-select-content`, since reka-ui portals render into
`<body>`). Cascade layers are declared up front:
`@layer theme, reset, base, components, utilities`.

`editor.css` holds only this **foundation** (Tailwind entry, `@theme` tokens,
`:root`/`.dark`, scoped reset/base). All component styling is **co-located in the
SFCs** as Tailwind utilities — there is no hand-written `.pb-*` component layer.
The one exception is **iframe page content**, which lives in
[page-frame.css](../src/styles/page-frame.css): those `.pb-*-block` rules render
inside the canvas/preview `<iframe>` (styled by that injected stylesheet, not by
Tailwind), so they stay as plain CSS.

Two coexisting token systems, both mapped through `@theme inline` so the
`.dark` class on `<html>` recolours every utility at runtime:

- **`pb-*`** — the editor chrome palette. `@theme inline` aliases
  `--color-uf-bg`/`--color-uf-text`/… to runtime `--pb-*` variables; `:root`
  holds the light values, `.dark` adds the inverse panel/text/border set.
  Semantic accents (`--uf-accent` blue, `--uf-symbol` violet, `--uf-danger`)
  stay theme-agnostic.
- **shadcn neutral tokens** — `:root` / `.dark` oklch values (`--background`,
  `--primary`, `--border`, `--ring`, `--radius`, …) mapped to utilities via
  `@theme inline` the same way.

Toggling is wired through `editor.storage.theme` ('light' | 'dark'); a
`watchEffect` in PageEditor flips `.dark` on `documentElement` so portaled
reka-ui content (Dialog / Select / Popover, rendered into `<body>`) picks
up the theme too. The iframe canvas is intentionally exempt — its
stylesheet is the raw `pageFrameStyles` string, independent of `@theme`.

The **`components/ui`** library is canonical shadcn-vue (reka-ui + cva) written
against those tokens. Primitives: alert, button, card, dialog, dropdown-menu,
input, label, popover, scroll-area, select, separator, slider, tabs, textarea,
toggle, tooltip, resizable. Composite controls built on top: color-input,
size-input (number + unit dropdown), confirm-dialog, prompt-dialog.
Interactive controls use a light `shadow-xs`; containers/overlays keep heavier
shadows.

## Persistence & serialization

`PageEditor` accepts a `storage` adapter or an `autosaveKey` shorthand
(`createLocalStorageAdapter`). `useAutosave` debounces saves of `document`.
`serialize` / `serializePageDocument` produce validated JSON; `core/utils/html.ts`
renders export HTML using each block's `renderHtml`.

### Editor preferences

`createEditorStorage(key)` ([useEditorStorage.ts](../src/vue/composables/editor/useEditorStorage.ts))
builds a `useLocalStorage` ref holding sidebar pin state, active mode, and
panel width. `usePageEditor` calls it once and exposes the ref as
`editor.storage`; the rail, the docked panel, and the floating flyout all read
the same instance. The page document is stored *separately* under the
consumer-provided autosave key — never mixed with UI preferences.

Two editors on the same page can pass different `prefsKey` props (forwarded
to `usePageEditor({ storageKey })`) so they persist preferences
independently. The default key matches the historical `uf-editor` value, so
single-instance usage upgrades transparently.

## Testing & build

- **Unit tests** (Vitest) live next to `core/utils/*` and
  `usePageEditor.test.ts` — pure tree/style/validation/storage logic is the most
  tested surface.
- `npm run typecheck` (vue-tsc), `npm test` (vitest), `npm run build`
  (typecheck → lib → playground).

## Extension points

- **Plugins** — `<PageEditor :plugins="UframePlugin[]">`. A plugin
  ([core/utils/plugin.ts](../src/core/utils/plugin.ts)) is plain data:
  `{ name, blocks?, styleTokens?, toolbarSlots?, panels? }`. `blocks` merge onto
  the registry (last-wins on a type clash, via `applyPlugins`), `styleTokens`
  become CSS custom properties on the `.uf-editor` root, `toolbarSlots` mount
  components into the toolbar clusters, and `panels` add custom left-sidebar
  modes. Pure collectors (`collectPluginBlocks`/`mergeStyleTokens`/
  `collectToolbarSlots`/`collectPanels`) are unit-tested; `PageEditor` resolves
  them once and exposes UI slots through `PageEditorContext.pluginSlots`. Core
  stays framework-agnostic via `UframePlugin<TComponent = unknown>` (the Vue
  layer instantiates it as `UframePlugin<Component>`).
- **Custom blocks** — pass a `blocks` registry to `PageEditor` (or extend
  `defaultBlockDefinitions`); each `BlockDefinition` brings its own render +
  settings components and zod schema. (Plugins are the higher-level path.)
- **Storage** — supply an `EditorStorageAdapter` (sync or async `load`/`save`).
- **Feature flags** — `features: { autosave, history, hotkeys, preview }`.
- **Theming** — override the `pb-*` tokens / shadcn tokens in `editor.css`, or
  per-instance via a plugin's `styleTokens`.

## Known follow-ups / tech debt

- `page-frame.css` `.uf-button-block--primary` keeps a teal default
  intentionally — it is *end-user page content*, not editor chrome.
- No git remote configured; work currently lives on local `main`.
