# Uframe Vite integration

The integration exposes the base CSS required by the component renderer as a
virtual, side-effect module.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { uframeIntegration } from 'uframe/integrations/vite'

export default defineConfig({
  plugins: [uframeIntegration()],
})
```

```ts
// entry-client.ts
import '@uframe/integrations/vite'
```

The virtual import enters Vite's regular CSS pipeline and exposes
`uframe`'s official exported-page reset (`src/styles/page-reset.css`). It is
normalized with uframe's `formatCss`, the same formatter used by HTML export
and the CSS preview. It does not include editor or `uf-*` service styles.
Document styles remain part of `UframeDocument` / the document renderer.
