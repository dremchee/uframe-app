import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

// TypeDoc (via typedoc-vitepress-theme) writes this sidebar when `docs:api`
// runs. Read it if present so the site still builds before the API ref exists.
const apiSidebarPath = fileURLToPath(new URL('./api/typedoc-sidebar.json', import.meta.url))
const apiSidebar = existsSync(apiSidebarPath)
  ? JSON.parse(readFileSync(apiSidebarPath, 'utf8'))
  : []

export default defineConfig({
  title: 'uframe',
  description: 'Embeddable page editor for any host — iframe client or Vue library.',
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/overview' },
      { text: 'Demo', link: '/demo' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Overview', link: '/guide/overview' },
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Localization', link: '/guide/localization' },
            { text: 'Editing on the canvas', link: '/guide/editing' },
            { text: 'Client API & protocol', link: '/guide/embedding' },
            { text: 'Rendering pages', link: '/guide/rendering' },
            { text: 'Extending the editor', link: '/guide/extending' },
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Integrations', link: '/guide/integrations' },
          ],
        },
      ],
      '/api/': apiSidebar,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dremchee/uframe-app' },
    ],
    search: { provider: 'local' },
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
      // The live editor pulls CodeMirror in; it needs single copies (see the
      // root vite.config.ts rationale).
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@lezer/common',
        '@lezer/highlight',
      ],
    },
    ssr: {
      // The editor's drag-and-drop deps expose subpath/directory entry points
      // (e.g. `.../closest-edge`) that Node's ESM loader can't resolve when
      // left external during SSR. Bundle them so Vite honours their exports map.
      noExternal: [
        '@atlaskit/pragmatic-drag-and-drop',
        '@atlaskit/pragmatic-drag-and-drop-hitbox',
      ],
    },
  },
})
