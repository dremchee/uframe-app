# Editing on the canvas

This page covers what end users can do inside the editor — useful both for them
and for you, so you know what the embedded surface offers. Everything here works
the same whether the editor is [embedded over the iframe client](./embedding) or
[mounted directly as the Vue component](./extending).

## Blocks

A page is a tree of **blocks**. Drag blocks in from the **Add** panel in the left
rail, reorder or nest them on the canvas (or in the **Layers** tree), and edit
their content inline. Built-ins cover structure (section, container, div, divider,
spacer), typography (heading, paragraph, text, list, link), media (image, embed),
and forms (form, label, input, textarea, checkbox, radio, select). Hosts can add
or replace block types — see [Extending the editor](./extending).

Select a block to edit it in the **Properties** panel, which splits into a
**Content** tab (block props) and a **Style** tab.

## Layout: flex & grid

Selecting a block reveals its layout controls in the Style panel, and the canvas
draws a live overlay so you edit layout visually rather than by typing numbers.

### Grid

When a block is `display: grid`, the **Grid** control edits the column and row
track lists, gap, auto-flow, and alignment; a child of a grid additionally gets
an **item placement** control (`grid-column` / `grid-row` and self-alignment).

Each axis has three modes via a **Tracks / Repeat / Auto** toggle:

- **Tracks** — an explicit track list you add/remove/resize, with quick 1–4
  equal-column presets.
- **Repeat** — a fixed `repeat(count, track-pattern)` template. The track pattern
  accepts CSS sizing functions such as `minmax(0, 1fr)` and can contain multiple
  tracks, for example `1fr 2fr`.
- **Auto** — a responsive `repeat(auto-fit | auto-fill, minmax(min, max))` edited
  as a repeat kind plus **Min** / **Max** fields. Cards reflow across columns with
  no fixed widths or media queries.

On the canvas, a grid shows **dashed track guide lines** and a content-box
outline. Drag the handle on any internal track boundary to resize that track —
the drag **preserves the track's own unit** (`fr` / `%` / `px` / `rem` / `em`)
and clamps to sane ranges.

### Flex

When a block is `display: flex`, **gap grips** appear between the measured child
boxes. They stay visible while the flex (or grid) block is selected and brighten
on hover/drag; drag a grip to resize the shared column/row gap. A selected flex or
grid block is also tinted in the gap accent colour so it reads as a layout
container at a glance.

### Unified gap

The gap field is unified across flex and grid: it reads the *effective* value
(the `gap` shorthand, falling back to the `row-gap` / `column-gap` longhands) and
normalises on write — a single `gap` when row and column match, longhands when
they differ. Switching a block between flex and grid never desyncs its gap. The
link/split toggle in the Grid control flips between one value and separate
row/column values.

> Canvas track-resize and gap grips edit the **base** style layer only. To tune a
> responsive breakpoint, switch the viewport and edit the field directly.

## Spacing overlay

While you focus or scrub-drag a margin/padding field, the canvas renders a
DevTools-style overlay around the selected block: four **margin bands** (orange)
and four **padding bands** (green), with the active edge labelled by a pixel
badge tinted to its band. Scrub-dragging a spacing field reflows the iframe each
frame, and the whole drag collapses into a single undo entry.

## Effects: shadows & filters

The Style panel's **Effects** section edits `box-shadow`, `filter`, and
`backdrop-filter` as **stacks** rather than raw CSS strings. Each is a list you
can grow with **Add**, reorder by dragging the handle, toggle with the eye, and
remove — and every entry opens its own editor in a popover anchored to the
panel edge (so it never covers the row you're editing).

- **Box shadows** — stack multiple shadows; each has an **Outside / Inside**
  (inset) toggle, **X / Y / Blur / Size** sliders, and a colour. The row summary
  reads e.g. `Outer shadow: 0px 10px 24px 0px`.
- **Filters** — applied to the element itself. Pick a function — blur,
  brightness, contrast, grayscale, hue-rotate, invert, opacity, saturate, sepia,
  or drop-shadow — and tune its single value (or X/Y/Blur/colour for
  drop-shadow). Disabled entries stay in the list but drop out of the output.
- **Backdrop filters** — the same control, applied to the area *behind* the
  element. The generated CSS also emits the `-webkit-backdrop-filter` prefix for
  Safari.

Each control's number field locks to its natural unit (px / % / deg) and shows
it inline. A `shadow`-typed **variable** is edited with the same box-shadow
stack control.

## Responsive & variables

- **Viewport switcher** — the toolbar switches between desktop / tablet / mobile
  (and a custom width). The active viewport doubles as the **edited style layer**:
  editing at tablet/mobile writes a responsive override; desktop writes the base.
  Breakpoints are fully document-defined in the **Settings** panel.
- **Variables** — define document-level CSS custom properties in the **Variables**
  panel, then bind any style field to a `var(...)` via its bind control.

## Symbols (reusable components)

Select a subtree and save it as a **component** (symbol). Instances reference the
master, so editing the master updates every instance; you can **detach** an
instance back into independent blocks, and define **variants** that layer class
overrides on the root. Components carry a distinct violet identity colour across
the tree, library, and properties panel. Manage them in the **Components** panel.

While editing a component master, publish selected inner block properties as
component **Props**. The editor assigns each prop a stable key, label, and
appropriate control type, then every instance can override that value from its
Properties panel without detaching. Resetting an override restores the value
from the active master. Public props also accept the same CMS bindings as
ordinary block props.

Public prop definitions can optionally provide `labelKey`, `control.placeholderKey`,
and `control.options[].labelKey`; these keys are resolved through the active editor
locale while the plain labels remain fallbacks.

Use a named **Slot** when an instance needs to own a subtree instead of a scalar
value. Slot is a Div-like container that can only be added while editing a
component, from the **Layers** panel; slot names must be unique inside that
component. A slot renders its master children as fallback content until an
instance customises or explicitly clears it. Instance-owned slot content remains
editable in Layers and on the canvas, and detaching materialises the resolved
content as ordinary blocks.

Component instances expose every public Slot as a row in **Layers**, including
Slots that still use fallback content. Drag any block or another component onto
that row to customise it; the first drop creates the instance fill and preserves
the fallback children in the same undoable operation. The row also provides
explicit Customize, Clear, and Reset-to-fallback actions.

## Keyboard & accessibility

The **Layers** tree follows the [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

| Key | Action |
| --- | --- |
| `↑` / `↓` | Move between rows |
| `→` / `←` | Expand / collapse (or move to parent/child) |
| `Home` / `End` | Jump to first / last row |
| `Enter` / `Space` | Select (selection follows focus) |
| `Alt` + `↑` / `↓` | Reorder the focused block |
| `Cmd/Ctrl` + `D` | Duplicate |
| `Delete` / `Backspace` | Delete the selected block |

The row list is virtualised, so focus stays on the tree container and the active
row is tracked with `aria-activedescendant`.
