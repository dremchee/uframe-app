import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Standalone build of the embeddable editor app (embed/index.html → EmbedApp).
// Output is portable static files (base './') that a host points an <iframe> at;
// Vue/reka/Tailwind are bundled in and never reach the host page.
export default defineConfig({
  // `embed/` is the build root so its index.html lands at embed-dist/index.html
  // (not embed-dist/embed/index.html).
  root: fileURLToPath(new URL('./embed', import.meta.url)),
  base: './',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Same single-copy requirements as the playground build (CodeMirror/Lezer
    // identity checks); see vite.config.ts for the rationale.
    dedupe: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/language',
      '@lezer/common',
      '@lezer/highlight',
    ],
  },
  build: {
    // Absolute path so it resolves against the repo, not the `embed/` root.
    outDir: fileURLToPath(new URL('./build/embed', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      // Two entries in ONE build: the editor app (index.html) and the official
      // AI plugin. Because they're co-built, Rollup hoists everything they share
      // — Vue, the editor context (its inject key), core, ui — into shared
      // chunks, so a runtime `import('./plugins/ai.js')` reuses the app's already
      // loaded modules and `useEditorContext()` resolves. That's how the plugin
      // loads by URL like any other, with no bundled copy or import map.
      input: {
        'index': fileURLToPath(new URL('./embed/index.html', import.meta.url)),
        'plugins/ai': fileURLToPath(new URL('./src/plugins/ai/index.ts', import.meta.url)),
      },
      // Stable name for the plugin entry so the host can reference it by URL;
      // everything else stays hashed for cache-busting.
      output: {
        entryFileNames: chunk => (chunk.name === 'plugins/ai' ? 'plugins/ai.js' : 'assets/[name]-[hash].js'),
      },
      // Keep the plugin entry's exports (it's dynamically imported, not linked).
      preserveEntrySignatures: 'allow-extension',
    },
  },
})
