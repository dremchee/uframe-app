# directus-extension-uframe

A Directus **bundle** extension that embeds the [uframe](../../README.md) block
editor as a custom **interface** on a JSON field. The editor runs in an isolated
`<iframe>` and edits **one record's** `PageDocument` (single-document mode);
Directus owns the page list, permissions, revisions and draft/publish.

The bundle has three entries:

- **module `uframe`** — a left-bar app: a master-detail manager for pages that
  **bootstraps its own hidden collections** (`uframe_pages` + `uframe_globals`),
  so there's nothing to set up by hand. See *Use the module* below.
- **interface `uframe-editor`** — a custom interface for a JSON field. Mounts the
  uframe editor over the framework-agnostic `uframe/embed` client; the editor's
  Save writes the document back into the field (`value ↔ onSave`). Use this if
  you prefer pages as a normal, visible Directus collection.
- **endpoint `uframe`** — serves the bundled embed app so the iframe has
  something to load (`/uframe/index.html`). No external hosting required.

## Use the module (zero-config)

Open the **uframe** item in the left bar. On first run it offers to create two
**hidden** collections it manages for you:

- **`uframe_pages`** — your pages (`title`, `slug`, `group`, `status`, and a
  `document` JSON field pre-wired to the uframe editor).
- **`uframe_globals`** — a **singleton** holding site-wide `GlobalSettings`
  (variables, breakpoints, classes, symbols, page defaults) shared by every page.

Then it's master-detail: pick a page on the left, edit it on the right, **Save**
writes the page's `document` and the shared globals. Your frontend reads both via
the items API — `GET /items/uframe_pages/:id` and `GET /items/uframe_globals`.

> Creating collections needs **admin** rights (the module runs as the logged-in
> user). The fields can be tweaked afterwards in Data Model like any collection.

## Set up the `pages` collection (manual interface)

Prefer a visible collection + the field interface? The interface attaches to any
JSON field; the convention is a `pages` collection:

1. Create a collection `pages` (primary key `id`).
2. Add fields: `title` (string), `slug` (string), `group` (string, optional),
   `status` (string — draft/published), and `document` (**type JSON**).
3. On the `document` field, set **Interface → uframe Page Editor**.

Pages are now native Directus content: list, search, filter, permissions,
revisions and draft/publish all work out of the box. Your frontend reads the raw
`PageDocument` via the items API — `GET /items/pages/:id` or
`GET /items/pages?filter[slug][_eq]=…`.

## Set up shared globals (optional)

CSS variables, breakpoints, classes, symbols (header/footer) and page defaults
are **site-wide**: edit them once and every page picks them up. They live in an
optional singleton — without it, each page keeps its own copy (single-document
mode), so this step is purely opt-in and existing setups are unaffected.

1. Create a collection `uframe_globals` and make it a **Singleton** (Data Model →
   the collection → *Singleton*).
2. Add one field `document` (**type JSON**).

The interface then loads `GET /items/uframe_globals` (its `document` field holds a
`GlobalSettings` object), merges it over the page at render time, and on **Save**
writes edits back via `PATCH /items/uframe_globals`. Your frontend reads the same
record and passes it to `resolveDocument` / `renderDocumentToHtml` alongside each
page.

## Develop

From the repo root (this is a pnpm workspace):

```bash
pnpm install
pnpm --filter directus-extension-uframe build
```

`build` runs three steps:

1. `build:embed` — builds the uframe embed app into `build/embed/` (repo root).
2. `build:ext` — `directus-extension build` → `dist/app.js` + `dist/api.js`.
3. `copy:embed` — copies `build/embed/` into `dist/embed/` so the endpoint serves it.

To iterate on the module code with watch mode:

```bash
pnpm --filter directus-extension-uframe dev
```

## Docker playground

A throwaway Directus instance (SQLite, no external DB) is in
[`playground/`](./playground/docker-compose.yml):

```bash
pnpm --filter directus-extension-uframe build   # build first (mounts dist/)
cd integrations/directus/playground
docker compose up
```

Open <http://localhost:8055>, log in with `admin@example.com` / `admin`, then
create the `pages` collection (see above) and open a record. `EXTENSIONS_AUTO_RELOAD`
reloads the extension after a rebuild — no container restart needed. Directus
data persists under `playground/data/` (gitignored); delete it to reset.

## Install into a Directus instance

Point your Directus `EXTENSIONS_PATH` at this package, or copy the built
`dist/` into `<directus>/extensions/directus-extension-uframe/`, then restart
Directus. The **uframe Page Editor** interface becomes selectable on any JSON
field.

## Notes

- The iframe loads `/uframe/index.html` — the bundled embed app served by this
  extension's endpoint, same origin as Directus. No external hosting needed.
- The interface stores a raw `PageDocument` in the JSON field. That JSON is what
  your frontend reads (items API) and renders — with `resolveDocument` +
  `renderDocumentToHtml` from `uframe/core`, or your own component mapping.
