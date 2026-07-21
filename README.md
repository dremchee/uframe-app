# uframe

A block-based Vue 3 page editor with a styling panel, document-level custom
variables, and configurable responsive breakpoints. You run it as a standalone
iframe app and drive it from any host with the framework-agnostic `uframe/embed`
client. Built with Vue 3 `<script setup>` SFCs.

uframe is an **editor engine you embed in your own app** — not a hosted website
builder. It's for:

- **Product teams** adding an in-app page/content builder (SaaS, CMS, landing
  tools) — embed it over the tiny client, host on any stack.
- **Vue teams** extending the editor with custom blocks, plugins, and panels —
  import `<PageEditor>` directly.
- **Platforms & agencies** offering white-label editing — rebrand via theme
  tokens, isolated in the iframe.

It's **embed-first, but not embed-only**. See the
[documentation](https://github.com/dremchee/uframe-app) — start with the overview for
who it's for, what you'd build, and what it's not.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Publishing

Pushing Conventional Commits to `main` publishes the package via GitHub Actions:
`fix:` creates a patch release, `feat:` creates a minor release, and
`BREAKING CHANGE` creates a major release. Configure npm Trusted Publishing for
`@dremchee/uframe` with this repository and the
`.github/workflows/publish-npm.yml` workflow before the first automated release.

## AI review workflow

This project includes a local Plannotator setup for reviewing Codex plans and
AI-generated code changes. See [docs/plannotator.md](docs/plannotator.md).
