import { defineConfig } from 'astro/config'

export default defineConfig({
  vite: {
    resolve: {
      // The shared block registry includes editor dependencies with directory
      // entrypoints. Resolve them through Vite instead of native Node ESM.
      noExternal: ['@dremchee/uframe', /^@atlaskit\//],
    },
  },
})
