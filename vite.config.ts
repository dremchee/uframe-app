import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // CodeMirror needs single copies of several packages:
    // - @codemirror/state / view: `instanceof` checks throw otherwise
    //   ("Unrecognized extension value in extension set").
    // - @lezer/highlight (+ common) and @codemirror/language: syntax
    //   highlighting matches the parser's Tag objects against
    //   defaultHighlightStyle's. Two prebundled copies = different Tag
    //   identities = highlighting silently renders as plain text.
    dedupe: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/language',
      '@lezer/common',
      '@lezer/highlight',
    ],
  },
  optimizeDeps: {
    // Pre-bundle the whole CodeMirror + Lezer set together so they share one
    // copy of @codemirror/state and one Tag registry (@lezer/highlight).
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/commands',
      '@codemirror/language',
      '@codemirror/lang-html',
      '@codemirror/lang-css',
      '@codemirror/lang-javascript',
      '@lezer/common',
      '@lezer/highlight',
    ],
  },
  build: {
    outDir: 'build/playground',
  },
})
