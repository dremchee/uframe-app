import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

// Load `*.css?raw` imports as a string (e.g. the iframe stylesheet
// page-frame.css). Vite handles this natively for the playground; tsdown
// (rolldown) needs an explicit loader for the library build.
const rawCss = {
  name: 'raw-css',
  resolveId(id: string, importer?: string) {
    if (id.endsWith('.css?raw') && importer)
      return `${resolve(dirname(importer), id.replace(/\?raw$/, ''))}?raw`
  },
  load(id: string) {
    if (id.endsWith('.css?raw'))
      return `export default ${JSON.stringify(readFileSync(id.replace(/\?raw$/, ''), 'utf8'))}`
  },
}

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'core': 'src/core/index.ts',
    'vue': 'src/vue/index.ts',
    'blocks': 'src/blocks/index.ts',
    'ui': 'src/components/ui/index.ts',
    // Official AI plugin (chat window, canvas ring, settings section). A
    // separate entry so it only lands in a consumer's bundle when imported;
    // `plugins/ai` mirrors the source folder and namespaces official plugins.
    'plugins/ai': 'src/plugins/ai/index.ts',
    // Framework-agnostic host client for the iframe embed (no Vue).
    'embed': 'src/embed/client.ts',
    // Published baseline for framework integrations that need the CSS string
    // at SSR time, without importing a raw CSS file into their server graph.
    'styles/page-frame': 'src/styles/page-frame.ts',
    // Vite plugin exposing the published-page base stylesheet as a virtual CSS import.
    'integrations/vite': 'integrations/vite/index.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  tsconfig: 'tsconfig.lib.json',
  clean: true,
  dts: {
    vue: true,
  },
  deps: {
    neverBundle: [
      // Server-only dependencies of integrations/vite. The package is built
      // for the neutral platform, so Rolldown needs these Node built-ins marked
      // external explicitly instead of reporting them as unresolved imports.
      'node:fs',
      'node:url',
      'vue',
      '@vueuse/core',
      '@vueuse/shared',
      'zod',
    ],
  },
  plugins: [
    rawCss,
    Vue({ isProduction: true }),
  ],
})
