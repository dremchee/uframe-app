import type { PageDocument, ShadowEntry } from '@'

// box-shadow is stored structured (a stack of ShadowEntry); these helpers build
// the seed values the template uses. Fresh arrays per call so no two blocks
// share a reference.
function softShadow(): ShadowEntry[] {
  return [
    { id: 'sh-soft-1', enabled: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(15,23,42,.06)' },
    { id: 'sh-soft-2', enabled: true, inset: false, x: 0, y: 10, blur: 30, spread: 0, color: 'rgba(15,23,42,.08)' },
  ]
}
function shadow(x: number, y: number, blur: number, color: string): ShadowEntry[] {
  return [{ id: 'sh-1', enabled: true, inset: false, x, y, blur, spread: 0, color }]
}

/**
 * Starter template that exercises every block type in the default registry:
 * section, container, div, divider, spacer, link, button, heading, paragraph,
 * text, list, list-item, image, embed, form, label, input, text-area,
 * checkbox, radio, select, select-option.
 *
 * It renders a small but complete marketing landing page — hero, feature
 * grid, content list, media, a working contact form, and a footer — so the
 * builder opens with a realistic document to play with rather than a blank
 * canvas.
 *
 * Layout mixes flexbox (hero CTAs, footer links, form field stacks) with a
 * responsive CSS Grid for the feature cards (`repeat(auto-fit, minmax(...))`),
 * editable via the Grid panel's Auto-fit mode.
 */
export const starterTemplate: PageDocument = {
  id: 'starter-template',
  title: 'Starter template',
  version: 1,
  settings: {
    width: 'responsive',
    background: '#f1f5f9',
  },
  // User-defined CSS custom properties, emitted into :root and referenced below
  // via var(--name). Edit them live in the editor's "Variables" panel.
  variables: [
    { key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' },
    { key: 'brand-2', name: 'brand-2', value: '#0ea5e9', type: 'color' },
    { key: 'brand-ink', name: 'brand-ink', value: '#042f2e', type: 'color' },
    { key: 'ink', name: 'ink', value: '#0b1220', type: 'color' },
    { key: 'surface', name: 'surface', value: '#ffffff', type: 'color' },
    { key: 'muted', name: 'muted', value: '#64748b', type: 'color' },
    { key: 'border', name: 'border', value: '#e7ecf3', type: 'color' },
    { key: 'radius', name: 'radius', value: '14px', type: 'size' },
    { key: 'shadow', name: 'shadow', value: '0 1px 2px rgba(15,23,42,.06), 0 10px 30px rgba(15,23,42,.08)', type: 'shadow' },
  ],
  updatedAt: new Date().toISOString(),
  blocks: [
    // ── Hero ────────────────────────────────────────────────────────────────
    {
      id: 'hero',
      type: 'section',
      props: {},
      style: {
        paddingTop: '128px',
        paddingBottom: '128px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: 'var(--ink)',
        // Layered gradient: a soft brand glow over a deep base — modern hero feel
        // without an image.
        backgroundImage: 'radial-gradient(900px 420px at 50% -8%, rgba(20,184,166,0.28), transparent 62%), linear-gradient(180deg, #0b1220 0%, #0f1f2b 100%)',
        color: '#f8fafc',
        textAlign: 'center',
      },
      children: [
        {
          id: 'hero-heading',
          type: 'heading',
          props: { content: 'Build pages from blocks', level: 1 },
          style: {
            fontSize: '52px',
            fontWeight: 700,
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
          },
        },
        {
          id: 'hero-subtitle',
          type: 'paragraph',
          props: {
            content:
              'A starter document that wires up every primitive — structure, typography, media, and forms — so you can see the whole toolkit at once.',
          },
          style: {
            fontSize: '19px',
            lineHeight: '1.6',
            color: '#cbd5f5',
            maxWidth: '620px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '32px',
          },
        },
        {
          id: 'hero-cta-row',
          type: 'container',
          props: {},
          style: {
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
          },
          children: [
            {
              id: 'hero-cta-primary',
              type: 'button',
              props: { label: 'Get started', href: '#contact', kind: 'link' },
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '24px',
                paddingRight: '24px',
                backgroundColor: 'var(--brand)',
                backgroundImage: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
                color: 'var(--brand-ink)',
                boxShadow: shadow(0, 10, 24, 'rgba(13,148,136,0.35)'),
                borderTopLeftRadius: 'var(--radius)',
                borderTopRightRadius: 'var(--radius)',
                borderBottomRightRadius: 'var(--radius)',
                borderBottomLeftRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
              },
            },
            {
              id: 'hero-cta-secondary',
              type: 'link',
              props: { href: '#features', target: '_self' },
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingLeft: '24px',
                paddingRight: '24px',
                color: '#f8fafc',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#334155',
                borderTopLeftRadius: 'var(--radius)',
                borderTopRightRadius: 'var(--radius)',
                borderBottomRightRadius: 'var(--radius)',
                borderBottomLeftRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
                gap: '8px',
              },
              children: [
                {
                  id: 'hero-cta-secondary-label',
                  type: 'text',
                  props: { content: 'Explore features' },
                  style: {},
                },
                {
                  id: 'hero-cta-secondary-arrow',
                  type: 'embed',
                  props: {
                    html:
                      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
                  },
                  style: { display: 'inline-flex', alignItems: 'center' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Features ──────────────────────────────────────────────────────────────
    {
      id: 'features',
      type: 'section',
      props: {},
      style: {
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: '#ffffff',
      },
      children: [
        {
          id: 'features-heading',
          type: 'heading',
          props: { content: 'Everything in one toolkit', level: 2 },
          style: {
            fontSize: '34px',
            fontWeight: 700,
            textAlign: 'center',
            color: '#0f172a',
            marginBottom: '12px',
          },
        },
        {
          id: 'features-intro',
          type: 'text',
          props: {
            content: 'Compose structure, content, and inputs from a single set of blocks.',
          },
          style: {
            fontSize: '17px',
            textAlign: 'center',
            color: '#475569',
            marginBottom: '48px',
          },
        },
        {
          id: 'features-grid',
          type: 'container',
          props: {},
          // Responsive CSS Grid: auto-fit + minmax reflows the cards 3→2→1 as the
          // canvas narrows, no fixed widths or media queries. Editable in the
          // Grid panel's "Auto-fit" mode (min 240px, max 1fr).
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
            maxWidth: '960px',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          children: [
            {
              id: 'feature-card-1',
              type: 'div',
              props: {},
              style: {
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '28px',
                paddingRight: '28px',
                backgroundColor: 'var(--surface)',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                borderBottomRightRadius: '18px',
                borderBottomLeftRadius: '18px',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                boxShadow: softShadow(),
              },
              children: [
                {
                  id: 'feature-card-1-icon',
                  type: 'embed',
                  props: {
                    html:
                      '<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#ccfbf1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></span>',
                  },
                  style: { marginBottom: '16px' },
                },
                {
                  id: 'feature-card-1-title',
                  type: 'heading',
                  props: { content: 'Structure', level: 3 },
                  style: { fontSize: '19px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' },
                },
                {
                  id: 'feature-card-1-text',
                  type: 'paragraph',
                  props: { content: 'Sections, containers, and divs give you flexible layout scaffolding.' },
                  style: { fontSize: '15px', lineHeight: '1.6', color: '#475569' },
                },
              ],
            },
            {
              id: 'feature-card-2',
              type: 'div',
              props: {},
              style: {
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '28px',
                paddingRight: '28px',
                backgroundColor: 'var(--surface)',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                borderBottomRightRadius: '18px',
                borderBottomLeftRadius: '18px',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                boxShadow: softShadow(),
              },
              children: [
                {
                  id: 'feature-card-2-icon',
                  type: 'embed',
                  props: {
                    html:
                      '<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#dbeafe"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg></span>',
                  },
                  style: { marginBottom: '16px' },
                },
                {
                  id: 'feature-card-2-title',
                  type: 'heading',
                  props: { content: 'Content', level: 3 },
                  style: { fontSize: '19px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' },
                },
                {
                  id: 'feature-card-2-text',
                  type: 'paragraph',
                  props: { content: 'Headings, paragraphs, text, lists, links, images, and embeds.' },
                  style: { fontSize: '15px', lineHeight: '1.6', color: '#475569' },
                },
              ],
            },
            {
              id: 'feature-card-3',
              type: 'div',
              props: {},
              style: {
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '28px',
                paddingRight: '28px',
                backgroundColor: 'var(--surface)',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                borderBottomRightRadius: '18px',
                borderBottomLeftRadius: '18px',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                boxShadow: softShadow(),
              },
              children: [
                {
                  id: 'feature-card-3-icon',
                  type: 'embed',
                  props: {
                    html:
                      '<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#fef3c7"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>',
                  },
                  style: { marginBottom: '16px' },
                },
                {
                  id: 'feature-card-3-title',
                  type: 'heading',
                  props: { content: 'Forms', level: 3 },
                  style: { fontSize: '19px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' },
                },
                {
                  id: 'feature-card-3-text',
                  type: 'paragraph',
                  props: { content: 'Inputs, text areas, checkboxes, radios, and selects — fully wired.' },
                  style: { fontSize: '15px', lineHeight: '1.6', color: '#475569' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Content list ─────────────────────────────────────────────────────────
    {
      id: 'workflow',
      type: 'section',
      props: {},
      style: {
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: '#f8fafc',
      },
      children: [
        {
          id: 'workflow-inner',
          type: 'container',
          props: {},
          style: {
            maxWidth: '720px',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          children: [
            {
              id: 'workflow-heading',
              type: 'heading',
              props: { content: 'How it works', level: 2 },
              style: { fontSize: '30px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' },
            },
            {
              id: 'workflow-steps',
              type: 'list',
              props: { ordered: true },
              style: {
                paddingLeft: '20px',
                marginBottom: '32px',
                color: '#334155',
                fontSize: '16px',
                lineHeight: '1.9',
              },
              children: [
                {
                  id: 'workflow-step-1',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-step-1-text', type: 'text', props: { content: 'Drop a section onto the canvas.' }, style: {} },
                  ],
                },
                {
                  id: 'workflow-step-2',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-step-2-text', type: 'text', props: { content: 'Nest containers and content blocks inside it.' }, style: {} },
                  ],
                },
                {
                  id: 'workflow-step-3',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-step-3-text', type: 'text', props: { content: 'Style each block and export the document.' }, style: {} },
                  ],
                },
              ],
            },
            {
              id: 'workflow-divider',
              type: 'divider',
              props: {},
              style: {
                borderTopWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#e2e8f0',
                marginBottom: '32px',
              },
            },
            {
              id: 'workflow-perks-heading',
              type: 'heading',
              props: { content: 'What you get', level: 3 },
              style: { fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' },
            },
            {
              id: 'workflow-perks',
              type: 'list',
              props: { ordered: false },
              style: {
                paddingLeft: '20px',
                color: '#334155',
                fontSize: '16px',
                lineHeight: '1.9',
              },
              children: [
                {
                  id: 'workflow-perk-1',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-perk-1-text', type: 'text', props: { content: 'Reusable, configurable primitives.' }, style: {} },
                  ],
                },
                {
                  id: 'workflow-perk-2',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-perk-2-text', type: 'text', props: { content: 'Webflow-style visual styling.' }, style: {} },
                  ],
                },
                {
                  id: 'workflow-perk-3',
                  type: 'list-item',
                  props: {},
                  style: {},
                  children: [
                    { id: 'workflow-perk-3-text', type: 'text', props: { content: 'Clean, serializable JSON output.' }, style: {} },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Media ──────────────────────────────────────────────────────────────────
    {
      id: 'media',
      type: 'section',
      props: {},
      style: {
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: '#ffffff',
      },
      children: [
        {
          id: 'media-inner',
          type: 'container',
          props: {},
          style: {
            maxWidth: '760px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
          },
          children: [
            {
              id: 'media-heading',
              type: 'heading',
              props: { content: 'Media blocks', level: 2 },
              style: { fontSize: '30px', fontWeight: 700, color: '#0f172a', marginBottom: '32px' },
            },
            {
              id: 'media-image',
              type: 'image',
              props: {
                src: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1200&q=80',
                alt: 'Workspace with a laptop',
                caption: 'A real <img> block with an optional caption.',
              },
              style: {
                width: '100%',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                borderBottomRightRadius: '18px',
                borderBottomLeftRadius: '18px',
                boxShadow: softShadow(),
                marginBottom: '40px',
              },
            },
            {
              id: 'media-embed',
              type: 'embed',
              props: {
                html:
                  '<iframe width="100%" height="380" style="border:0;border-radius:12px" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Embedded video" allowfullscreen></iframe>',
              },
              style: {},
            },
          ],
        },
      ],
    },

    // ── Contact form ──────────────────────────────────────────────────────────
    {
      id: 'contact',
      type: 'section',
      props: {},
      style: {
        paddingTop: '88px',
        paddingBottom: '88px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: 'var(--ink)',
        backgroundImage: 'radial-gradient(700px 380px at 50% 110%, rgba(14,165,233,0.22), transparent 60%)',
        color: '#f8fafc',
      },
      children: [
        {
          id: 'contact-inner',
          type: 'container',
          props: {},
          style: {
            maxWidth: '560px',
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          children: [
            {
              id: 'contact-icon',
              type: 'embed',
              props: {
                html:
                  '<span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:9999px;background:rgba(20,184,166,0.15)"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>',
              },
              style: { textAlign: 'center', marginBottom: '16px' },
            },
            {
              id: 'contact-heading',
              type: 'heading',
              props: { content: 'Get in touch', level: 2 },
              style: { fontSize: '30px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' },
            },
            {
              id: 'contact-sub',
              type: 'paragraph',
              props: { content: 'A working form built entirely from form blocks.' },
              style: { fontSize: '16px', color: '#cbd5f5', textAlign: 'center', marginBottom: '32px' },
            },
            {
              id: 'contact-form',
              type: 'form',
              props: { action: '#', method: 'post', name: 'contact' },
              // Glass panel: translucent surface + hairline border on the dark
              // section — a modern, layered look.
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                paddingTop: '32px',
                paddingBottom: '32px',
                paddingLeft: '28px',
                paddingRight: '28px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                borderBottomRightRadius: '20px',
                borderBottomLeftRadius: '20px',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.10)',
                boxShadow: shadow(0, 24, 60, 'rgba(2,6,23,0.45)'),
              },
              children: [
                // Name field
                {
                  id: 'field-name',
                  type: 'div',
                  props: {},
                  style: { display: 'flex', flexDirection: 'column', gap: '6px' },
                  children: [
                    {
                      id: 'label-name',
                      type: 'label',
                      props: { text: 'Full name', for: 'input-name' },
                      style: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0' },
                    },
                    {
                      id: 'input-name',
                      type: 'input',
                      props: { name: 'name', type: 'text', placeholder: 'Jane Doe', required: true },
                      style: {
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        borderTopLeftRadius: 'var(--radius)',
                        borderTopRightRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)',
                        borderBottomLeftRadius: 'var(--radius)',
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: '#334155',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '15px',
                      },
                    },
                  ],
                },
                // Email field
                {
                  id: 'field-email',
                  type: 'div',
                  props: {},
                  style: { display: 'flex', flexDirection: 'column', gap: '6px' },
                  children: [
                    {
                      id: 'label-email',
                      type: 'label',
                      props: { text: 'Email', for: 'input-email' },
                      style: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0' },
                    },
                    {
                      id: 'input-email',
                      type: 'input',
                      props: { name: 'email', type: 'email', placeholder: 'jane@example.com', required: true },
                      style: {
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        borderTopLeftRadius: 'var(--radius)',
                        borderTopRightRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)',
                        borderBottomLeftRadius: 'var(--radius)',
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: '#334155',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '15px',
                      },
                    },
                  ],
                },
                // Topic select
                {
                  id: 'field-topic',
                  type: 'div',
                  props: {},
                  style: { display: 'flex', flexDirection: 'column', gap: '6px' },
                  children: [
                    {
                      id: 'label-topic',
                      type: 'label',
                      props: { text: 'Topic', for: 'select-topic' },
                      style: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0' },
                    },
                    {
                      id: 'select-topic',
                      type: 'select',
                      props: { name: 'topic' },
                      style: {
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        borderTopLeftRadius: 'var(--radius)',
                        borderTopRightRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)',
                        borderBottomLeftRadius: 'var(--radius)',
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: '#334155',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '15px',
                      },
                      children: [
                        { id: 'topic-general', type: 'select-option', props: { value: 'general', label: 'General question', selected: true }, style: {} },
                        { id: 'topic-sales', type: 'select-option', props: { value: 'sales', label: 'Sales' }, style: {} },
                        { id: 'topic-support', type: 'select-option', props: { value: 'support', label: 'Support' }, style: {} },
                      ],
                    },
                  ],
                },
                // Message textarea
                {
                  id: 'field-message',
                  type: 'div',
                  props: {},
                  style: { display: 'flex', flexDirection: 'column', gap: '6px' },
                  children: [
                    {
                      id: 'label-message',
                      type: 'label',
                      props: { text: 'Message', for: 'textarea-message' },
                      style: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0' },
                    },
                    {
                      id: 'textarea-message',
                      type: 'text-area',
                      props: { name: 'message', placeholder: 'Tell us a little about your project…', rows: 5, required: true },
                      style: {
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        borderTopLeftRadius: 'var(--radius)',
                        borderTopRightRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)',
                        borderBottomLeftRadius: 'var(--radius)',
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: '#334155',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '15px',
                      },
                    },
                  ],
                },
                // Preferred contact — radios
                {
                  id: 'field-pref',
                  type: 'div',
                  props: {},
                  style: { display: 'flex', flexDirection: 'column', gap: '8px' },
                  children: [
                    {
                      id: 'label-pref',
                      type: 'label',
                      props: { text: 'Preferred contact method' },
                      style: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0' },
                    },
                    {
                      id: 'radio-email',
                      type: 'radio',
                      props: { name: 'preferred', label: 'Email', value: 'email', checked: true },
                      style: { fontSize: '15px', color: '#cbd5f5' },
                    },
                    {
                      id: 'radio-phone',
                      type: 'radio',
                      props: { name: 'preferred', label: 'Phone', value: 'phone' },
                      style: { fontSize: '15px', color: '#cbd5f5' },
                    },
                  ],
                },
                // Consent checkbox
                {
                  id: 'checkbox-consent',
                  type: 'checkbox',
                  props: { name: 'consent', label: 'I agree to be contacted about my request.', value: 'yes', required: true },
                  style: { fontSize: '15px', color: '#cbd5f5' },
                },
                // Submit
                {
                  id: 'contact-submit',
                  type: 'button',
                  props: { label: 'Send message', href: '#', kind: 'submit' },
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    backgroundColor: 'var(--brand)',
                    color: 'var(--brand-ink)',
                    borderTopLeftRadius: 'var(--radius)',
                    borderTopRightRadius: 'var(--radius)',
                    borderBottomRightRadius: 'var(--radius)',
                    borderBottomLeftRadius: 'var(--radius)',
                    fontWeight: 600,
                    fontSize: '15px',
                    borderTopWidth: '0px',
                    borderRightWidth: '0px',
                    borderBottomWidth: '0px',
                    borderLeftWidth: '0px',
                  },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Footer ──────────────────────────────────────────────────────────────────
    {
      id: 'footer',
      type: 'section',
      props: {},
      style: {
        paddingTop: '40px',
        paddingBottom: '40px',
        paddingLeft: '24px',
        paddingRight: '24px',
        backgroundColor: '#020617',
        color: '#94a3b8',
        textAlign: 'center',
      },
      children: [
        {
          id: 'footer-spacer',
          type: 'spacer',
          props: { height: 8 },
          style: {},
        },
        {
          id: 'footer-links',
          type: 'container',
          props: {},
          style: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' },
          children: [
            {
              id: 'footer-link-docs',
              type: 'link',
              props: { href: '#', target: '_blank', rel: 'noopener' },
              style: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#cbd5f5', fontSize: '14px', textDecoration: 'none' },
              children: [
                {
                  id: 'footer-link-docs-icon',
                  type: 'embed',
                  props: {
                    html:
                      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
                  },
                  style: { display: 'inline-flex', alignItems: 'center' },
                },
                { id: 'footer-link-docs-text', type: 'text', props: { content: 'Docs' }, style: {} },
              ],
            },
            {
              id: 'footer-link-github',
              type: 'link',
              props: { href: '#', target: '_blank', rel: 'noopener' },
              style: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#cbd5f5', fontSize: '14px', textDecoration: 'none' },
              children: [
                {
                  id: 'footer-link-github-icon',
                  type: 'embed',
                  props: {
                    html:
                      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
                  },
                  style: { display: 'inline-flex', alignItems: 'center' },
                },
                { id: 'footer-link-github-text', type: 'text', props: { content: 'GitHub' }, style: {} },
              ],
            },
          ],
        },
        {
          id: 'footer-note',
          type: 'text',
          props: { content: 'Built with the page builder — every block on one page.' },
          style: { fontSize: '13px' },
        },
      ],
    },
  ],
}
