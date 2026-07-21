import type { PageDocument, ResolveContext } from '@dremchee/uframe/core'

// A bundled sample template + the data its dynamic blocks need, so the app
// renders something meaningful with no CMS wired up. Mirrors what the uframe
// editor produces and what `useUframePage` would otherwise fetch.

const POSTS_LIST_ID = 'data-list_posts'

export const sampleDocument: PageDocument = {
  id: 'sample',
  title: 'uframe · SSR demo',
  version: 1,
  updatedAt: '2026-06-25T00:00:00.000Z',
  settings: { width: 'responsive', background: '#ffffff' },
  styles: {},
  blocks: [
    {
      id: 'section_hero',
      type: 'section',
      props: {},
      style: {
        paddingTop: '64px',
        paddingBottom: '48px',
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '760px',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
      children: [
        {
          id: 'heading_title',
          type: 'heading',
          props: { content: 'Rendered by uframe SSR', level: 1 },
          style: { fontSize: '42px', fontWeight: 700, marginBottom: '16px', lineHeight: '1.1' },
        },
        {
          id: 'para_intro',
          type: 'paragraph',
          props: {
            content: 'This page is a PageDocument resolved and rendered to HTML on the server with uframe’s core renderer — no editor runtime shipped to the client.',
          },
          style: { color: '#475569', fontSize: '18px', marginBottom: '24px' },
        },
        {
          id: 'img_hero',
          type: 'image',
          props: { src: 'https://picsum.photos/seed/uframe/760/360', alt: 'Demo banner', caption: 'A responsive image block' },
          style: { marginBottom: '24px' },
        },
        {
          id: 'btn_cta',
          type: 'button',
          props: { label: 'Open Nuxt docs', href: 'https://nuxt.com', kind: 'link' },
          style: {
            display: 'inline-flex',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingLeft: '18px',
            paddingRight: '18px',
            backgroundColor: '#0f766e',
            color: '#ffffff',
            fontWeight: 600,
            textDecoration: 'none',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          },
        },
      ],
    },
    {
      id: 'section_posts',
      type: 'section',
      props: {},
      style: {
        paddingTop: '8px',
        paddingBottom: '64px',
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '760px',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
      children: [
        {
          id: 'heading_posts',
          type: 'heading',
          props: { content: 'Latest posts (dynamic)', level: 2 },
          style: { fontSize: '28px', fontWeight: 700, marginBottom: '16px' },
        },
        {
          // Repeats its child template once per row of `context.data[id]`.
          id: POSTS_LIST_ID,
          type: 'data-list',
          props: {},
          source: { collection: 'posts', limit: 10 },
          style: { display: 'grid', gap: '16px' },
          children: [
            {
              id: 'post_card',
              type: 'div',
              props: {},
              style: {
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '20px',
                paddingRight: '20px',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderTopStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderLeftStyle: 'solid',
                borderTopColor: '#e2e8f0',
                borderRightColor: '#e2e8f0',
                borderBottomColor: '#e2e8f0',
                borderLeftColor: '#e2e8f0',
              },
              children: [
                {
                  id: 'post_title',
                  type: 'heading',
                  props: { content: 'Post title', level: 3 },
                  // Bound to the current row's `title` field.
                  bindings: { content: 'item.title' },
                  style: { fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
                },
                {
                  id: 'post_excerpt',
                  type: 'paragraph',
                  props: { content: 'Excerpt' },
                  bindings: { content: 'item.excerpt' },
                  style: { color: '#64748b' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// The data `sampleDocument`'s bindings resolve against. In a real app this is
// fetched per `collectDataRequirements(document)` and keyed by block id.
export const sampleContext: ResolveContext = {
  page: { title: 'uframe SSR demo' },
  data: {
    [POSTS_LIST_ID]: [
      { title: 'Server-side rendering with uframe', excerpt: 'Resolve a PageDocument and render it to HTML on the server.' },
      { title: 'Bindings & Data Lists', excerpt: 'Bind block props to CMS fields; repeat a template once per record.' },
      { title: 'Headless and CMS-agnostic', excerpt: 'The document declares what data it needs; you fetch it and map it in.' },
    ],
  },
}
