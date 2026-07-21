# Getting started

`@dremchee/uframe` is a block-based page editor that can be used in two ways:

- as an isolated editor application in an `<iframe>` — suitable for any host stack;
- as a Vue library, when the host needs custom blocks, panels, or direct access to the editor runtime.

## Embed the hosted editor

The quickest integration does not require building or deploying the editor yourself.
Install the small, framework-agnostic host client:

```bash
pnpm add @dremchee/uframe
```

Then mount the hosted editor application:

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target: document.querySelector('#editor')!,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  document: myDocument,
  onSave: document => fetch('/api/pages/home', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(document),
  }),
})
```

`createUframeEditor` creates an iframe and communicates with it through a typed
`postMessage` protocol. The host client has no framework peer dependencies, so
it works with React, Vue, Svelte, server-rendered applications, or plain HTML.

See the complete [client API](./embedding), including multi-page documents,
assets, runtime plugins, and editor state.

## Self-host the editor

If the editor must be served from your own domain or deployed with a specific
release, build the static embed app from this repository:

```bash
pnpm install
pnpm build:embed
```

The result is `build/embed/`. Publish that directory to any static host and use
its `index.html` as `src`:

```ts
createUframeEditor({
  target,
  src: 'https://static.example.com/uframe/embed/index.html',
})
```

Keep the `index.html`, its assets, and the optional `plugins/` directory at the
same deployment location.

## Use the Vue library

For a native Vue integration, import `PageEditor` and its styles instead of
creating an iframe:

```vue
<script setup lang="ts">
import { PageEditor } from '@dremchee/uframe'
import '@dremchee/uframe/styles.css'

const page = defineModel('page', { required: true })
</script>

<template>
  <PageEditor v-model="page" @save="savePage" />
</template>
```

The Vue path supports custom blocks and direct plugins. Start with
[Extending the editor](./extending) for its complete API.

## Next steps

- [Edit on the canvas](./editing)
- [Configure localization](./localization)
- [Render and export pages](./rendering)
- [Theme the editor](./theming)
