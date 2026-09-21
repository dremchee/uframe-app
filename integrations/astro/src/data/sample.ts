import type { PageDocument, ResolveContext } from '@dremchee/uframe/core'

export const document: PageDocument = {
  id: 'astro-demo',
  title: 'uframe & Astro',
  version: 1,
  updatedAt: '2026-09-21T00:00:00.000Z',
  settings: { width: 'responsive', background: '#ffffff' },
  fonts: { families: [{ family: 'Inter', provider: 'google', weights: [400, 700] }] },
  blocks: [
    {
      id: 'hero',
      type: 'heading',
      props: { level: 1, content: 'Welcome' },
      bindings: { content: 'page.title' },
      style: { color: '#0f766e', paddingTop: '24px', paddingBottom: '24px' },
    },
    {
      id: 'posts',
      type: 'data-list',
      props: {},
      source: { collection: 'posts' },
      children: [{
        id: 'post-title',
        type: 'paragraph',
        props: { content: '' },
        bindings: { content: 'item.title' },
      }],
    },
  ],
}

export const context: ResolveContext = {
  page: { title: 'Rendered with Astro' },
  data: {
    posts: [{ title: 'Static pages' }, { title: 'Server rendering' }],
  },
}
