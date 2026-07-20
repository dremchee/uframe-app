import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Build — emits the self-contained `dist/index.js` the editor loads by path.
// React/ReactDOM are BUNDLED IN (the custom element must work on its own), so
// only `uframe` is external. No shared-framework requirement: a web-component
// plugin imports no editor framework at all.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['uframe', /^uframe\//],
    },
  },
})
