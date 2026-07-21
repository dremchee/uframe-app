# Overview

uframe is an **engine for an embeddable, block-based page editor**. You drop it
into your own app and give your users a visual canvas where they compose a page
from blocks, style it, and serialize the result to JSON or HTML. It is a building
block for *your* product — not a hosted website builder.

## Who it's for

- **Product teams who need an in-app page/content builder.** SaaS apps, CMSes,
  landing-page tools — anywhere end users should assemble pages from blocks
  without you shipping a heavy editor in your bundle or fighting CSS clashes. Use
  the [embed client](./embedding): the editor runs in an iframe and you drive it
  from any stack (React, Svelte, plain HTML — no framework lock-in).
- **Vue teams who need an *extensible* editor.** Already on Vue and want to add
  your own blocks, plugins, toolbar buttons, or sidebar panels? Import
  [`<PageEditor>` directly](./extending). A plugin is just an object an npm
  package exports — no runtime to learn.
- **Platforms & agencies offering white-label editing.** The editor chrome
  rebrands through `uf-*` [theme tokens](./theming) and stays isolated in its
  iframe, so you can hand it to your own customers as part of your product.

## What you'd build with it

- Let non-technical users **compose pages from blocks** — landing pages, content
  sections, forms (structure, typography, media, and form blocks ship built-in).
- Offer **visual layout editing without code** — flex/grid with drag handles and
  gap grips, a spacing overlay, stacked shadow/filter effects, responsive
  breakpoints, and document-level CSS variables. See
  [Editing on the canvas](./editing).
- Ship **reusable design** via symbols (components) with variants.
- Keep **your data in your format** — the document is zod-validated JSON with an
  HTML export, and persistence runs through a storage adapter you supply. Your
  backend, your rules.
- **Publish the result on any frontend** — render the saved document to HTML (or
  Vue components) server-side, statically, or in the browser with the
  framework-agnostic core. See [Rendering pages](./rendering).

## What it's not

- **Not a hosted website builder.** There's no backend, deploy, or auth — uframe
  is the *editor engine* you embed, not a Tilda/Webflow-style service.
- **Vue at the core.** The host can be anything via the embed client, but custom
  blocks are authored as Vue components.
- **Early stage.** The library is pre-1.0 and under active development; APIs may
  still shift.

## Two ways to integrate

| | Embed client | Vue component |
| --- | --- | --- |
| Import | `@dremchee/uframe/embed` | `@dremchee/uframe` (`<PageEditor>`) |
| Host stack | Any (iframe + postMessage) | Vue |
| Bundle impact | Tiny — DOM + postMessage | Pulls in Vue |
| Isolation | Full (iframe sandbox) | In-app |
| Extend (custom blocks/plugins/panels) | — | ✓ |

uframe is **embed-first, but not embed-only**. Start with
[Getting started](./getting-started) for the embed path, or jump to
[Extending the editor](./extending) for the Vue path.
