import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
// In a standalone project this is `import { uframeCss } from '@dremchee/uframe/vite'`.
import { uframeCss } from '../../src/vite/uframe-css'

// Dev config — serves the HMR playground (index.html → playground/main.ts).
// The plugin source under src/ is part of this Vite graph, so editing
// CalloutBlock.vue / CalloutSettings.vue hot-reloads live inside the editor.
// `uframeCss()` enables `import css from './X.vue?uframe-css'` (lifts <style>).
export default defineConfig({
  plugins: [uframeCss(), vue()],
  // resolve: {
  //   alias: { uframe: fileURLToPath(new URL('../../src', import.meta.url)) },
  // },
})
