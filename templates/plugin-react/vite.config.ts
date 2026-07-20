import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev — serves the standalone playground (index.html) with HMR. The plugin's
// custom element renders on a blank page; you don't need the editor running to
// iterate on the block itself.
export default defineConfig({
  plugins: [react()],
})
