import type { BlockStyles, CssVariable, GlobalSettings, PageDocument, ShadowEntry, SymbolDefinition } from '@'
import { SYMBOL_INSTANCE_BLOCK_TYPE } from '@'

// box-shadow is stored structured (a stack of ShadowEntry); these helpers build
// the seed values the templates use. Fresh arrays per call so no two blocks
// share a reference.
function softShadow(): ShadowEntry[] {
  return [
    { id: 'sh-soft-1', enabled: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(15,23,42,.06)' },
    { id: 'sh-soft-2', enabled: true, inset: false, x: 0, y: 10, blur: 30, spread: 0, color: 'rgba(15,23,42,.08)' },
  ]
}
export function shadow(x: number, y: number, blur: number, color: string): ShadowEntry[] {
  return [{ id: 'sh-1', enabled: true, inset: false, x, y, blur, spread: 0, color }]
}

// Feature-card icons: lucide SVG paths + a tinted tile colour pair (light bg +
// stronger stroke), one shade per card — mirrors how starter-template colours
// its card icons. Declared before the templates that use them.
interface FeatureIcon { paths: string, bg: string, fg: string }
const ICON_ZAP: FeatureIcon = {
  paths: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  bg: '#ccfbf1',
  fg: '#0f766e',
}
const ICON_SLIDERS: FeatureIcon = {
  paths: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  bg: '#dbeafe',
  fg: '#1d4ed8',
}
const ICON_PACKAGE: FeatureIcon = {
  paths: '<path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  bg: '#fef3c7',
  fg: '#b45309',
}

// A shared palette so every generated template feels like one product. Lifted
// into the shared globals (templateGlobals); emitted into :root and editable in
// the Variables panel. `key` is the frozen CSS ident, `name` the display label.
export function palette(): CssVariable[] {
  const tokens: Array<Omit<CssVariable, 'key'>> = [
    { name: 'brand', value: '#6366f1', type: 'color' },
    { name: 'brand-2', value: '#8b5cf6', type: 'color' },
    { name: 'ink', value: '#0b1220', type: 'color' },
    { name: 'surface', value: '#ffffff', type: 'color' },
    { name: 'muted', value: '#64748b', type: 'color' },
    { name: 'border', value: '#e7ecf3', type: 'color' },
    { name: 'radius', value: '14px', type: 'size' },
    { name: 'shadow', value: '0 1px 2px rgba(15,23,42,.06), 0 10px 30px rgba(15,23,42,.08)', type: 'shadow' },
  ]
  // Key (frozen CSS ident) starts equal to the label — `var(--brand)` etc.
  return tokens.map(t => ({ key: t.name, ...t }))
}

// Shared page body for every template: same width, background, and base
// typography so all pages feel like one site. Edit here to retheme globally.
export function bodySettings(): PageDocument['settings'] {
  return {
    width: 'responsive',
    background: '#f8fafc',
    style: { fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--ink)' },
  }
}

export const SECTION_PAD = {
  paddingTop: '88px',
  paddingBottom: '88px',
  paddingLeft: '24px',
  paddingRight: '24px',
} as const

export const RADIUS_ALL = {
  borderTopLeftRadius: 'var(--radius)',
  borderTopRightRadius: 'var(--radius)',
  borderBottomRightRadius: 'var(--radius)',
  borderBottomLeftRadius: 'var(--radius)',
} as const

export const CARD = {
  paddingTop: '32px',
  paddingBottom: '32px',
  paddingLeft: '28px',
  paddingRight: '28px',
  backgroundColor: 'var(--surface)',
  borderTopWidth: '1px',
  borderRightWidth: '1px',
  borderBottomWidth: '1px',
  borderLeftWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border)',
  boxShadow: softShadow(),
  ...RADIUS_ALL,
} as const

// ── Landing ──────────────────────────────────────────────────────────────────
const landingTemplate: PageDocument = {
  id: 'tpl-landing',
  title: 'Landing',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'lp-hero',
      type: 'section',
      props: {},
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
          id: 'lp-hero-h',
          type: 'heading',
          props: { content: 'Ship pages, not tickets', level: 1 },
          style: { fontSize: '54px', fontWeight: 700, lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '16px' },
        },
        {
          id: 'lp-hero-p',
          type: 'paragraph',
          props: { content: 'A visual builder your whole team can use. Compose, style, and publish — no deploy required.' },
          style: { fontSize: '19px', lineHeight: '1.6', color: '#cbd5f5', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '32px' },
        },
        {
          id: 'lp-hero-cta',
          type: 'button',
          props: { label: 'Start building', href: '#', kind: 'link' },
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '14px',
            paddingBottom: '14px',
            paddingLeft: '28px',
            paddingRight: '28px',
            backgroundImage: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '16px',
            textDecoration: 'none',
            boxShadow: shadow(0, 10, 24, 'rgba(99,102,241,0.40)'),
            ...RADIUS_ALL,
          },
        },
      ],
    },
    {
      id: 'lp-features',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'lp-features-h',
          type: 'heading',
          props: { content: 'Why teams pick us', level: 2 },
          style: { fontSize: '34px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)', marginBottom: '48px' },
        },
        {
          id: 'lp-features-grid',
          type: 'container',
          props: {},
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '960px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            featureCard('lp-f1', ICON_ZAP, 'Fast', 'Build a page in minutes with reusable blocks.'),
            featureCard('lp-f2', ICON_SLIDERS, 'Flexible', 'Style anything with full visual control.'),
            featureCard('lp-f3', ICON_PACKAGE, 'Portable', 'Clean JSON you can render anywhere.'),
          ],
        },
      ],
    },
  ],
}

// ── About ──────────────────────────────────────────────────────────────────
const aboutTemplate: PageDocument = {
  id: 'tpl-about',
  title: 'About',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'ab-hero',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: '#f8fafc', textAlign: 'center' },
      children: [
        {
          id: 'ab-hero-h',
          type: 'heading',
          props: { content: 'We build tools for builders', level: 1 },
          style: { fontSize: '44px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' },
        },
        {
          id: 'ab-hero-p',
          type: 'paragraph',
          props: { content: 'A small team obsessed with letting people create on the web without friction.' },
          style: { fontSize: '18px', lineHeight: '1.6', color: 'var(--muted)', maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto' },
        },
      ],
    },
    {
      id: 'ab-story',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'ab-story-inner',
          type: 'container',
          props: {},
          style: { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            {
              id: 'ab-story-h',
              type: 'heading',
              props: { content: 'Our story', level: 2 },
              style: { fontSize: '30px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' },
            },
            {
              id: 'ab-story-p1',
              type: 'paragraph',
              props: { content: 'We started because publishing a simple page still meant filing a ticket and waiting for a deploy. So we built a block-based editor anyone can drive.' },
              style: { fontSize: '17px', lineHeight: '1.8', color: '#334155', marginBottom: '16px' },
            },
            {
              id: 'ab-story-p2',
              type: 'paragraph',
              props: { content: 'Today it powers landing pages, docs, and in-app content for teams of every size.' },
              style: { fontSize: '17px', lineHeight: '1.8', color: '#334155' },
            },
          ],
        },
      ],
    },
    {
      id: 'ab-team',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: '#f8fafc' },
      children: [
        {
          id: 'ab-team-h',
          type: 'heading',
          props: { content: 'The team', level: 2 },
          style: { fontSize: '30px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)', marginBottom: '40px' },
        },
        {
          id: 'ab-team-grid',
          type: 'container',
          props: {},
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            teamCard('ab-t1', 'Ada Lovelace', 'Engineering', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=3&w=160&h=160&q=80'),
            teamCard('ab-t2', 'Alan Turing', 'Design', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=3&w=160&h=160&q=80'),
            teamCard('ab-t3', 'Grace Hopper', 'Product', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=3&w=160&h=160&q=80'),
          ],
        },
      ],
    },
  ],
}

// ── Pricing ──────────────────────────────────────────────────────────────────
const pricingTemplate: PageDocument = {
  id: 'tpl-pricing',
  title: 'Pricing',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'pr-head',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, paddingBottom: '32px', textAlign: 'center' },
      children: [
        {
          id: 'pr-head-h',
          type: 'heading',
          props: { content: 'Simple, honest pricing', level: 1 },
          style: { fontSize: '44px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' },
        },
        {
          id: 'pr-head-p',
          type: 'paragraph',
          props: { content: 'Start free. Upgrade when you grow. Cancel anytime.' },
          style: { fontSize: '18px', color: 'var(--muted)' },
        },
      ],
    },
    {
      id: 'pr-grid-sec',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, paddingTop: '24px' },
      children: [
        {
          id: 'pr-grid',
          type: 'container',
          props: {},
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', maxWidth: '960px', marginLeft: 'auto', marginRight: 'auto', alignItems: 'stretch' },
          children: [
            priceCard('pr-free', 'Free', '$0', 'For trying things out', false),
            priceCard('pr-pro', 'Pro', '$19', 'For growing teams', true),
            priceCard('pr-ent', 'Enterprise', 'Custom', 'For scale & support', false),
          ],
        },
      ],
    },
  ],
}

// ── Contact ──────────────────────────────────────────────────────────────────
const contactTemplate: PageDocument = {
  id: 'tpl-contact',
  title: 'Contact',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'ct-sec',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: '#f8fafc' },
      children: [
        {
          id: 'ct-inner',
          type: 'container',
          props: {},
          style: { maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            {
              id: 'ct-h',
              type: 'heading',
              props: { content: 'Get in touch', level: 1 },
              style: { fontSize: '38px', fontWeight: 700, textAlign: 'center', color: 'var(--ink)', marginBottom: '8px' },
            },
            {
              id: 'ct-p',
              type: 'paragraph',
              props: { content: 'Tell us what you need and we’ll get back within a day.' },
              style: { fontSize: '16px', color: 'var(--muted)', textAlign: 'center', marginBottom: '32px' },
            },
            {
              id: 'ct-form',
              type: 'form',
              props: { action: '#', method: 'post', name: 'contact' },
              style: { display: 'flex', flexDirection: 'column', gap: '18px', ...CARD },
              children: [
                field('ct-name', 'Full name', { id: 'ct-name-i', type: 'input', props: { name: 'name', type: 'text', placeholder: 'Jane Doe', required: true }, style: inputStyle() }),
                field('ct-email', 'Email', { id: 'ct-email-i', type: 'input', props: { name: 'email', type: 'email', placeholder: 'jane@example.com', required: true }, style: inputStyle() }),
                field('ct-msg', 'Message', { id: 'ct-msg-i', type: 'text-area', props: { name: 'message', placeholder: 'How can we help?', rows: 5, required: true }, style: inputStyle() }),
                {
                  id: 'ct-submit',
                  type: 'button',
                  props: { label: 'Send message', href: '#', kind: 'submit' },
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    backgroundImage: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '15px',
                    borderTopWidth: '0px',
                    borderRightWidth: '0px',
                    borderBottomWidth: '0px',
                    borderLeftWidth: '0px',
                    ...RADIUS_ALL,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// ── Blog post ────────────────────────────────────────────────────────────────
const blogTemplate: PageDocument = {
  id: 'tpl-blog',
  title: 'Blog post',
  group: 'Blog',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'bl-hero',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, paddingBottom: '32px', backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'bl-hero-inner',
          type: 'container',
          props: {},
          style: { maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' },
          children: [
            { id: 'bl-cat', type: 'text', props: { content: 'PRODUCT' }, style: { fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: '12px' } },
            { id: 'bl-title', type: 'heading', props: { content: 'How we built a block editor', level: 1 }, style: { fontSize: '44px', fontWeight: 700, lineHeight: '1.15', color: 'var(--ink)', marginBottom: '16px' } },
            { id: 'bl-meta', type: 'text', props: { content: 'By Ada Lovelace · 6 min read' }, style: { fontSize: '14px', color: 'var(--muted)' } },
          ],
        },
      ],
    },
    {
      id: 'bl-cover-sec',
      type: 'section',
      props: {},
      style: { paddingLeft: '24px', paddingRight: '24px', backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'bl-cover',
          type: 'image',
          props: { src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80', alt: 'Desk with a notebook' },
          style: { width: '100%', maxWidth: '860px', display: 'block', marginLeft: 'auto', marginRight: 'auto', boxShadow: softShadow(), ...RADIUS_ALL },
        },
      ],
    },
    {
      id: 'bl-body',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, backgroundColor: 'var(--surface)' },
      children: [
        {
          id: 'bl-body-inner',
          type: 'container',
          props: {},
          style: { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' },
          children: [
            { id: 'bl-p1', type: 'paragraph', props: { content: 'We set out to make publishing a page feel like assembling blocks — no deploys, no tickets, just composition. Here is what we learned along the way.' }, style: { fontSize: '19px', lineHeight: '1.8', color: '#334155', marginBottom: '28px' } },
            { id: 'bl-h2', type: 'heading', props: { content: 'Why blocks', level: 2 }, style: { fontSize: '28px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' } },
            { id: 'bl-p2', type: 'paragraph', props: { content: 'A small set of primitives composes into anything: structure, content, media, and forms. Constraints make the system predictable and the output clean.' }, style: { fontSize: '17px', lineHeight: '1.8', color: '#334155', marginBottom: '24px' } },
            {
              id: 'bl-quote',
              type: 'div',
              props: {},
              style: { paddingTop: '4px', paddingBottom: '4px', paddingLeft: '20px', borderLeftWidth: '3px', borderStyle: 'solid', borderColor: 'var(--brand)', marginBottom: '24px' },
              children: [
                { id: 'bl-quote-t', type: 'text', props: { content: '“Composition beats configuration.”' }, style: { fontSize: '20px', fontStyle: 'italic', color: 'var(--ink)' } },
              ],
            },
            {
              id: 'bl-list',
              type: 'list',
              props: { ordered: false },
              style: { paddingLeft: '20px', color: '#334155', fontSize: '17px', lineHeight: '1.9', marginBottom: '24px' },
              children: [
                bullet('bl-li1', 'Reusable, configurable primitives'),
                bullet('bl-li2', 'Visual, class-based styling'),
                bullet('bl-li3', 'Clean, serializable JSON output'),
              ],
            },
            { id: 'bl-p3', type: 'paragraph', props: { content: 'The result is an editor anyone on the team can drive — and a document model that renders anywhere.' }, style: { fontSize: '17px', lineHeight: '1.8', color: '#334155' } },
          ],
        },
      ],
    },
  ],
}

// ── Blog index (list of articles) — lives at the root, no group ──────────────
const blogIndexTemplate: PageDocument = {
  id: 'tpl-blog-index',
  title: 'Blog index',
  version: 1,
  settings: bodySettings(),
  variables: palette(),
  updatedAt: new Date().toISOString(),
  blocks: [
    {
      id: 'bi-head',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, paddingBottom: '32px', textAlign: 'center' },
      children: [
        { id: 'bi-title', type: 'heading', props: { content: 'Blog', level: 1 }, style: { fontSize: '44px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' } },
        { id: 'bi-sub', type: 'paragraph', props: { content: 'Product notes, deep dives, and the occasional opinion.' }, style: { fontSize: '18px', color: 'var(--muted)' } },
      ],
    },
    {
      id: 'bi-grid-sec',
      type: 'section',
      props: {},
      style: { ...SECTION_PAD, paddingTop: '24px' },
      children: [
        {
          id: 'bi-grid',
          type: 'container',
          props: {},
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto', alignItems: 'stretch' },
          children: [
            articleCard('bi-a1', 'How we built a block editor', 'A small set of primitives composes into anything.', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'),
            articleCard('bi-a2', 'Designing the styling panel', 'Visual, class-based styling without leaving the canvas.', 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=800&q=80'),
            articleCard('bi-a3', 'Shipping multi-page editing', 'Pages as a flat list, grouped by an attribute.', 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=80'),
          ],
        },
      ],
    },
  ],
}

// ── Block factories ──────────────────────────────────────────────────────────
function bullet(id: string, text: string): PageDocument['blocks'][number] {
  return { id, type: 'list-item', props: {}, style: {}, children: [{ id: `${id}-t`, type: 'text', props: { content: text }, style: {} }] }
}

function articleCard(id: string, title: string, excerpt: string, img: string): PageDocument['blocks'][number] {
  return {
    id,
    type: 'div',
    props: {},
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'var(--surface)',
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--border)',
      boxShadow: softShadow(),
      ...RADIUS_ALL,
    },
    children: [
      { id: `${id}-cover`, type: 'div', props: {}, style: { height: '160px', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } },
      {
        id: `${id}-body`,
        type: 'div',
        props: {},
        style: { display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '18px', paddingBottom: '20px', paddingLeft: '20px', paddingRight: '20px' },
        children: [
          { id: `${id}-cat`, type: 'text', props: { content: 'PRODUCT' }, style: { fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--brand)' } },
          { id: `${id}-title`, type: 'heading', props: { content: title, level: 3 }, style: { fontSize: '18px', fontWeight: 600, color: 'var(--ink)', lineHeight: '1.3' } },
          { id: `${id}-excerpt`, type: 'paragraph', props: { content: excerpt }, style: { fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)' } },
          { id: `${id}-meta`, type: 'text', props: { content: 'Ada Lovelace · 6 min' }, style: { fontSize: '12px', color: 'var(--muted)', marginTop: '4px' } },
        ],
      },
    ],
  }
}

function featureCard(id: string, icon: FeatureIcon, title: string, body: string): PageDocument['blocks'][number] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${icon.fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.paths}</svg>`
  return {
    id,
    type: 'div',
    props: {},
    style: { ...CARD },
    children: [
      {
        id: `${id}-icon`,
        type: 'embed',
        props: { html: `<span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:${icon.bg}">${svg}</span>` },
        style: { marginBottom: '14px' },
      },
      { id: `${id}-h`, type: 'heading', props: { content: title, level: 3 }, style: { fontSize: '19px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' } },
      { id: `${id}-p`, type: 'paragraph', props: { content: body }, style: { fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' } },
    ],
  }
}

function teamCard(id: string, name: string, role: string, avatar: string): PageDocument['blocks'][number] {
  return {
    id,
    type: 'div',
    props: {},
    style: { ...CARD, textAlign: 'center' },
    children: [
      {
        id: `${id}-avatar`,
        type: 'image',
        props: { src: avatar, alt: name },
        style: { display: 'block', overflow: 'hidden', width: '72px', height: '72px', borderTopLeftRadius: '9999px', borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px', borderBottomLeftRadius: '9999px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '14px' },
      },
      { id: `${id}-name`, type: 'heading', props: { content: name, level: 3 }, style: { fontSize: '17px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' } },
      { id: `${id}-role`, type: 'text', props: { content: role }, style: { fontSize: '14px', color: 'var(--muted)' } },
    ],
  }
}

function priceCard(id: string, name: string, price: string, blurb: string, featured: boolean): PageDocument['blocks'][number] {
  return {
    id,
    type: 'div',
    props: {},
    style: {
      ...CARD,
      textAlign: 'center',
      ...(featured
        ? { borderColor: 'var(--brand)', boxShadow: shadow(0, 16, 40, 'rgba(99,102,241,0.25)') }
        : {}),
    },
    children: [
      { id: `${id}-name`, type: 'heading', props: { content: name, level: 3 }, style: { fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' } },
      { id: `${id}-price`, type: 'heading', props: { content: price, level: 2 }, style: { fontSize: '40px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' } },
      { id: `${id}-blurb`, type: 'text', props: { content: blurb }, style: { fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' } },
      {
        id: `${id}-cta`,
        type: 'button',
        props: { label: featured ? 'Start free trial' : 'Choose plan', href: '#', kind: 'link' },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '10px',
          paddingBottom: '10px',
          paddingLeft: '20px',
          paddingRight: '20px',
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
          ...RADIUS_ALL,
          ...(featured
            ? { backgroundImage: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)', color: '#ffffff' }
            : { backgroundColor: 'transparent', color: 'var(--ink)', borderTopWidth: '1px', borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }),
        },
      },
    ],
  }
}

function inputStyle(): BlockStyles {
  return {
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '12px',
    paddingRight: '12px',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    backgroundColor: '#ffffff',
    color: 'var(--ink)',
    fontSize: '15px',
    ...RADIUS_ALL,
  }
}

function field(id: string, label: string, control: PageDocument['blocks'][number]): PageDocument['blocks'][number] {
  return {
    id,
    type: 'div',
    props: {},
    style: { display: 'flex', flexDirection: 'column', gap: '6px' },
    children: [
      { id: `${id}-l`, type: 'label', props: { text: label, for: control.id }, style: { fontSize: '14px', fontWeight: 600, color: 'var(--ink)' } },
      control,
    ],
  }
}

// ── Shared chrome: header (with nav) + footer as reusable components ─────────
// Built as symbols so every page renders the same instance; edit the master in
// the Components panel and all pages update. Each document gets its own copy of
// the definitions (symbols are per-document), keyed by a stable id.
const HEADER_SYMBOL_ID = 'sym-site-header'
const FOOTER_SYMBOL_ID = 'sym-site-footer'

const NAV = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

function navLink(id: string, label: string, href: string, color: string): PageDocument['blocks'][number] {
  return {
    id,
    type: 'link',
    props: { href, target: '_self' },
    style: { color, fontSize: '15px', fontWeight: 500, textDecoration: 'none' },
    children: [{ id: `${id}-t`, type: 'text', props: { content: label }, style: {} }],
  }
}

const headerSymbol: SymbolDefinition = {
  id: HEADER_SYMBOL_ID,
  name: 'Site header',
  updatedAt: new Date().toISOString(),
  variants: [{ id: 'var-header-default', name: 'Default', classes: [] }],
  defaultVariantId: 'var-header-default',
  root: {
    id: 'site-header-root',
    type: 'section',
    props: {},
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '18px',
      paddingBottom: '18px',
      paddingLeft: '24px',
      paddingRight: '24px',
      backgroundColor: 'var(--surface)',
      borderBottomWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--border)',
    },
    children: [
      { id: 'site-header-logo', type: 'heading', props: { content: '◆ Acme', level: 3 }, style: { fontSize: '18px', fontWeight: 700, color: 'var(--ink)' } },
      {
        id: 'site-header-nav',
        type: 'container',
        props: {},
        style: { display: 'flex', gap: '24px', alignItems: 'center' },
        children: NAV.map((n, i) => navLink(`site-header-nav-${i}`, n.label, n.href, 'var(--ink)')),
      },
    ],
  },
}

const footerSymbol: SymbolDefinition = {
  id: FOOTER_SYMBOL_ID,
  name: 'Site footer',
  updatedAt: new Date().toISOString(),
  variants: [{ id: 'var-footer-default', name: 'Default', classes: [] }],
  defaultVariantId: 'var-footer-default',
  root: {
    id: 'site-footer-root',
    type: 'section',
    props: {},
    style: {
      paddingTop: '40px',
      paddingBottom: '40px',
      paddingLeft: '24px',
      paddingRight: '24px',
      backgroundColor: 'var(--ink)',
      color: '#94a3b8',
      textAlign: 'center',
    },
    children: [
      {
        id: 'site-footer-links',
        type: 'container',
        props: {},
        style: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' },
        children: NAV.map((n, i) => navLink(`site-footer-nav-${i}`, n.label, n.href, '#cbd5f5')),
      },
      { id: 'site-footer-note', type: 'text', props: { content: '© Acme, Inc. — built with uframe.' }, style: { fontSize: '13px' } },
    ],
  },
}

// Fresh copy of the shared symbol definitions for one document.
function sharedSymbols(): Record<string, SymbolDefinition> {
  return JSON.parse(JSON.stringify({
    [HEADER_SYMBOL_ID]: headerSymbol,
    [FOOTER_SYMBOL_ID]: footerSymbol,
  })) as Record<string, SymbolDefinition>
}

function instance(id: string, symbolId: string): PageDocument['blocks'][number] {
  return { id, type: SYMBOL_INSTANCE_BLOCK_TYPE, props: { symbolId } }
}

// Wrap a template with the shared header instance (top) and footer instance
// (bottom), and register the symbol definitions on the document.
function withChrome(doc: PageDocument, prefix: string): PageDocument {
  return {
    ...doc,
    symbols: { ...sharedSymbols(), ...(doc.symbols ?? {}) },
    blocks: [
      instance(`${prefix}-header`, HEADER_SYMBOL_ID),
      ...doc.blocks,
      instance(`${prefix}-footer`, FOOTER_SYMBOL_ID),
    ],
  }
}

/**
 * Ready-made page templates, ordered for the Pages panel. Every page shares
 *  the header (with nav) and footer components.
 */
export const pageTemplates: PageDocument[] = [
  withChrome(landingTemplate, 'lp'),
  withChrome(aboutTemplate, 'ab'),
  withChrome(pricingTemplate, 'pr'),
  withChrome(contactTemplate, 'ct'),
  withChrome(blogIndexTemplate, 'bi'),
  withChrome(blogTemplate, 'bl'),
]

// ── Shared context ("site") ──────────────────────────────────────────────────
// The design tokens, page defaults and chrome symbols every template draws on,
// lifted out of the per-page documents so editing them is GLOBAL across the set.
// Hosts that support a shared context (the playground; Directus later) seed from
// here and pair it with `stripPageGlobals`-ed pages; self-contained hosts (the
// embed / docs demo, which can't yet receive a site) keep using the per-page
// copies baked into `pageTemplates`.
export function templateGlobals(): GlobalSettings {
  const base = bodySettings()
  return {
    variables: palette(),
    symbols: sharedSymbols(),
    defaults: { background: base.background, style: base.style },
    version: 1,
    updatedAt: new Date().toISOString(),
  }
}

// Drop the globals `templateGlobals()` now owns from a page so it defers to the
// shared site (the render-time merge restores them). Symbol INSTANCES in
// `blocks` stay — they resolve against the site's symbol defs.
export function stripPageGlobals(doc: PageDocument): PageDocument {
  return {
    ...doc,
    variables: undefined,
    symbols: undefined,
    settings: { width: doc.settings.width, background: '' },
  }
}
