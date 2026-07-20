import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Dev — serves the standalone playground (index.html) with HMR. `customElement`
// makes Svelte compile components to custom elements and auto-register them on
// import.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { customElement: true } })],
})
