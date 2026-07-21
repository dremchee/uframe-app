import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
// In a standalone project this is `import { uframeCss } from '@dremchee/uframe/vite'`.
import { uframeCss } from '../../src/vite/uframe-css'

// Build config — produces the runtime artifact `dist/index.js` that the editor
// loads by path at init. Externalize anything you import that the editor also
// provides: `vue`, `zod`, `uframe` here. The plugin must NOT bundle its own
// copies — at runtime it binds to the editor's shared instances (via the
// editor's import map). Two copies of Vue = broken reactivity/context inside
// the iframe. (Add `@vueuse/core` to this list only if you start importing it.)
export default defineConfig({
  plugins: [uframeCss(), vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['vue', 'zod', '@dremchee/uframe', /^@dremchee\/uframe\//],
    },
  },
})
