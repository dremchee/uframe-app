import { fileURLToPath, URL } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Build — emits the self-contained `dist/index.js` the editor loads by path.
// The Svelte runtime is bundled in (the custom element must work on its own),
// so only `uframe` is external.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['@dremchee/uframe', /^@dremchee\/uframe\//],
    },
  },
})
