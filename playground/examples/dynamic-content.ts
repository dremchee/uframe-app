import type { NormalizedSchema, PageDocument, ResolveContext } from '@'
import { resolveMockAsset } from './media'
import { bodySettings, CARD, palette, RADIUS_ALL, SECTION_PAD } from './templates'

// Mocks for the dynamic-content demo: a CMS-like schema for the binding picker,
// a page that already wires a Data List + bound blocks, and sample data
// (keyed by block id) the frontend `resolveDocument` would consume.

// Stable id shared between the template's Data List and the sample data.
const POSTS_LIST_ID = 'demo-posts-list'

// Inline SVG cover — always valid, no network (so the demo can't hang on a
// broken image). A real CMS returns an asset URL here.
function cover(fill: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="${fill}"/></svg>`)}`
}

// What a CMS adapter would push via `uframe:setSchema` — drives the picker.
export const mockSchema: NormalizedSchema = {
  collections: [
    {
      name: 'posts',
      label: 'Posts',
      kind: 'collection',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'excerpt', type: 'text' },
        { name: 'cover', type: 'file' },
        { name: 'date', type: 'date' },
        { name: 'author', type: 'relation', relation: { kind: 'm2o', collection: 'authors' } },
      ],
    },
    {
      name: 'authors',
      label: 'Authors',
      kind: 'collection',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'avatar', type: 'file' },
      ],
    },
    {
      name: 'home',
      label: 'Home',
      kind: 'singleton',
      fields: [
        { name: 'heroTitle', type: 'string' },
        { name: 'heroSubtitle', type: 'text' },
      ],
    },
  ],
}

// What a CMS adapter would push via `uframe:setDataContext` — sample rows for
// the Data List, keyed by its block id.
// Stable id for the singleton hero (Data Item).
const HOME_ITEM_ID = 'demo-home-hero'

export const mockDataContext: ResolveContext = {
  // Stands in for the CMS asset resolver — turns a picked `asset` ref into a URL
  // (so media survives a reload, when the runtime preview cache is empty).
  resolveAsset: resolveMockAsset,
  data: {
    [HOME_ITEM_ID]: {
      heroTitle: 'Build pages visually, ship plain JSON',
      heroSubtitle: 'uframe binds your CMS fields straight into blocks — no framework lock-in.',
    },
    [POSTS_LIST_ID]: [
      { title: 'Designing with uframe', excerpt: 'A tour of the block model.', cover: cover('#c7d2fe') },
      { title: 'Headless, not styleless', excerpt: 'Bring your own CMS — bind any field.', cover: cover('#bae6fd') },
      { title: 'Bind anything', excerpt: 'Collection fields flow straight into props.', cover: cover('#bbf7d0') },
    ],
  },
}

// A page that shows the dynamic blocks in action: a Data List over `posts`
// whose card binds image/heading/text to `item.*`. The prop values are the
// editor-time fallbacks; `resolveDocument` swaps in `mockDataContext` rows.
export const dynamicTemplate: PageDocument = {
  id: 'demo-dynamic',
  title: 'Dynamic (CMS)',
  group: 'Dynamic',
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  // Same palette + body settings as the page templates so the CMS demo feels
  // like one site with the rest.
  settings: bodySettings(),
  variables: palette(),
  blocks: [
    {
      // Data Item — the `home` singleton as a hero; children render once, bound
      // to the single record. Styled like the landing hero.
      id: HOME_ITEM_ID,
      type: 'data-item',
      props: {},
      source: { collection: 'home' },
      style: {
        ...SECTION_PAD,
        paddingTop: '120px',
        paddingBottom: '120px',
        backgroundColor: 'var(--ink)',
        backgroundImage: 'radial-gradient(900px 420px at 50% -8%, rgba(99,102,241,0.30), transparent 62%), linear-gradient(180deg, #0b1220 0%, #111a2e 100%)',
        color: '#f8fafc',
        textAlign: 'center',
      },
      children: [
        {
          id: 'demo-hero-title',
          type: 'heading',
          props: { content: 'Hero title', level: 1 },
          style: { fontSize: '54px', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '16px' },
          bindings: { content: 'item.heroTitle' },
        },
        {
          id: 'demo-hero-sub',
          type: 'paragraph',
          props: { content: 'Hero subtitle.' },
          style: { fontSize: '19px', lineHeight: '1.6', color: '#cbd5f5', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' },
          bindings: { content: 'item.heroSubtitle' },
        },
      ],
    },
    {
      id: 'demo-sec',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'demo-h',
          type: 'heading',
          props: { content: 'Latest posts', level: 2 },
          style: { fontSize: '34px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)', marginBottom: '48px' },
        },
        {
          id: POSTS_LIST_ID,
          type: 'data-list',
          props: {},
          source: { collection: 'posts', sort: ['-date'], limit: 3 },
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '960px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            {
              id: 'demo-card',
              type: 'div',
              props: {},
              style: { ...CARD },
              children: [
                {
                  id: 'demo-card-img',
                  type: 'image',
                  props: { src: cover('#e2e8f0'), alt: '' },
                  style: { width: '100%', marginBottom: '16px', overflow: 'hidden', ...RADIUS_ALL },
                  bindings: { src: 'item.cover', alt: 'item.title' },
                },
                {
                  id: 'demo-card-title',
                  type: 'heading',
                  props: { content: 'Post title', level: 3 },
                  style: { fontSize: '19px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' },
                  bindings: { content: 'item.title' },
                },
                {
                  id: 'demo-card-excerpt',
                  type: 'text',
                  props: { content: 'Post excerpt goes here.' },
                  style: { fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' },
                  bindings: { content: 'item.excerpt' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
