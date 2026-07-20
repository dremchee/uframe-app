import type { BlockDefinition, BlockRegistry } from '@/core/types/block-registry'
import type { PageDocument, SymbolDefinition } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core/types/page-document'
import { collectBlockCss, escapeHtml, renderBlocksToHtml, renderDocumentBody } from '@/core/utils/html'
import { renderDocumentToFragment, renderDocumentToHtml, renderSiteFiles, slugify } from '@/core/utils/html-export'

function defineHeading(): BlockDefinition {
  return {
    type: 'heading',
    label: 'Heading',
    defaultProps: {},
    propsSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
    renderComponent: {},
    renderHtml(block, ctx) {
      const level = (block.props as { level?: number }).level ?? 2
      const content = (block.props as { content?: string }).content ?? ''
      return `<h${level} class="${ctx.classes}">${ctx.escape(content)}</h${level}>`
    },
  } as BlockDefinition
}

function defineContainer(): BlockDefinition {
  return {
    type: 'container',
    label: 'Container',
    defaultProps: {},
    propsSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
    renderComponent: {},
    acceptsChildren: true,
    renderHtml(_block, ctx) {
      return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
    },
  } as BlockDefinition
}

// A raw-HTML block that isolates its content in a sandboxed iframe when the
// render context is untrusted — mirrors the embed block's renderHtml branch.
function defineRaw(): BlockDefinition {
  return {
    type: 'raw',
    label: 'Raw',
    defaultProps: {},
    propsSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
    renderComponent: {},
    renderHtml(block, ctx) {
      const html = (block.props as { html?: string }).html ?? ''
      if (ctx.untrusted && html)
        return `<div class="${ctx.classes}"><iframe sandbox="allow-scripts" srcdoc="${ctx.escape(html)}"></iframe></div>`
      return `<div class="${ctx.classes}">${html}</div>`
    },
  } as BlockDefinition
}

function makeRegistry(): BlockRegistry {
  return {
    heading: defineHeading(),
    container: defineContainer(),
    raw: defineRaw(),
  }
}

describe('escapeHtml', () => {
  it('escapes the five XML-significant characters', () => {
    expect(escapeHtml(`<a href="x" data-q='y' & z>`))
      .toBe('&lt;a href=&quot;x&quot; data-q=&#39;y&#39; &amp; z&gt;')
  })

  it('returns plain strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('renderBlocksToHtml', () => {
  it('falls back to a <div data-uf-unknown-type> for unregistered types', () => {
    const html = renderBlocksToHtml([{ id: 'x', type: 'mystery', props: {} }], {})
    expect(html).toContain('<div data-uf-unknown-type="mystery"></div>')
  })

  it('injects a custom htmlId into the block opening tag', () => {
    const html = renderBlocksToHtml(
      [{ id: 'h', type: 'heading', props: { level: 1, content: 'Hi' }, htmlId: 'hero' }],
      makeRegistry(),
    )
    expect(html).toContain('<h1 id="hero">')
  })

  it('renders hidden blocks with an inline display:none (no extra class)', () => {
    const html = renderBlocksToHtml(
      [{ id: 'h', type: 'heading', props: { level: 1, content: 'Hi' }, classes: ['title'], hidden: true }],
      makeRegistry(),
    )
    expect(html).toContain('<h1 style="display: none" class="title">')
    expect(html).not.toContain('uf-block-h')
  })

  it('uses the per-block renderer and escapes content', () => {
    const html = renderBlocksToHtml(
      [{ id: 'h', type: 'heading', props: { level: 1, content: '<script>' } }],
      makeRegistry(),
    )
    expect(html).toContain('<h1>&lt;script&gt;</h1>')
  })

  it('walks children recursively and joins via renderChildren()', () => {
    const html = renderBlocksToHtml(
      [
        {
          id: 'c',
          type: 'container',
          props: {},
          children: [
            { id: 'h1', type: 'heading', props: { content: 'A' } },
            { id: 'h2', type: 'heading', props: { content: 'B' } },
          ],
        },
      ],
      makeRegistry(),
    )
    expect(html.indexOf('<h2>A</h2>')).toBeGreaterThanOrEqual(0)
    expect(html.indexOf('<h2>A</h2>')).toBeLessThan(html.indexOf('<h2>B</h2>'))
  })

  it('includes applied named classes in the block class string', () => {
    const html = renderBlocksToHtml(
      [{ id: 'h', type: 'heading', props: { content: 'X' }, classes: ['hero', 'centered'] }],
      makeRegistry(),
    )
    expect(html).toContain('class="hero centered"')
  })

  it('emits the generated element class only for locally styled blocks', () => {
    const html = renderBlocksToHtml(
      [
        { id: 'plain', type: 'heading', props: { content: 'P' } },
        { id: 'styled', type: 'heading', props: { content: 'S' }, style: { color: '#000' } },
      ],
      makeRegistry(),
    )
    expect(html).not.toContain('uf-block-plain')
    expect(html).toContain('<h2 class="uf-block-styled">S</h2>')
  })

  it('materializes public property overrides when rendering a symbol instance', () => {
    const symbol: SymbolDefinition = {
      id: 'sym_heading',
      name: 'Heading',
      root: { id: 'master-heading', type: 'heading', props: { content: 'Fallback' } },
      variants: [{ id: 'default', name: 'Default', classes: [] }],
      defaultVariantId: 'default',
      properties: [{
        id: 'prop_text',
        key: 'text',
        label: 'Text',
        target: { blockId: 'master-heading', prop: 'content' },
        control: { type: 'text' },
      }],
      updatedAt: '',
    }
    const html = renderBlocksToHtml(
      [{
        id: 'instance',
        type: '__symbol',
        props: { symbolId: symbol.id, propertyValues: { prop_text: 'Buy now' } },
      }],
      makeRegistry(),
      0,
      { [symbol.id]: symbol },
    )

    expect(html).toContain('<h2>Buy now</h2>')
    expect(html).not.toContain('Fallback')
  })

  it('renders instance-owned content in a component Slot', () => {
    const symbol: SymbolDefinition = {
      id: 'sym_card',
      name: 'Card',
      root: {
        id: 'master-card',
        type: 'container',
        props: {},
        children: [{
          id: 'content-slot',
          type: 'slot',
          props: { name: 'content' },
          children: [{ id: 'fallback', type: 'heading', props: { content: 'Fallback' } }],
        }],
      },
      variants: [{ id: 'default', name: 'Default', classes: [] }],
      defaultVariantId: 'default',
      updatedAt: '',
    }
    const html = renderBlocksToHtml(
      [{
        id: 'instance',
        type: SYMBOL_INSTANCE_BLOCK_TYPE,
        props: { symbolId: symbol.id },
        children: [{
          id: 'content-fill',
          type: '__symbol_slot_fill',
          props: { slotId: 'content-slot' },
          children: [{ id: 'custom', type: 'heading', props: { content: 'Custom' } }],
        }],
      }],
      makeRegistry(),
      0,
      { [symbol.id]: symbol },
    )

    expect(html).toContain('<h2>Custom</h2>')
    expect(html).not.toContain('Fallback')
  })
})

describe('renderDocumentToHtml', () => {
  function makeDoc(): PageDocument {
    return {
      id: 'p',
      title: 'My title',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: 'h', type: 'heading', props: { content: 'Hello' } }],
    }
  }

  it('emits a full standalone HTML document with inline styles', () => {
    const html = renderDocumentToHtml(makeDoc(), makeRegistry())
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('<title>My title</title>')
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain('<style>')
    expect(html).toContain('<h2>Hello</h2>')
  })

  it('uses options.title and lang overrides', () => {
    const html = renderDocumentToHtml(makeDoc(), makeRegistry(), {
      title: 'Override',
      lang: 'ru',
    })
    expect(html).toContain('<title>Override</title>')
    expect(html).toContain('<html lang="ru">')
  })

  it('links an external stylesheet via cssHref instead of inlining', () => {
    const html = renderDocumentToHtml(makeDoc(), makeRegistry(), {
      cssHref: '/page.css',
    })
    expect(html).toContain('<link rel="stylesheet" href="/page.css">')
    expect(html).not.toContain('<style>')
  })

  it('prepends baseStyles before document styles when inlining', () => {
    const html = renderDocumentToHtml(makeDoc(), makeRegistry(), {
      baseStyles: '/* base */',
    })
    const styleStart = html.indexOf('<style>')
    const styleEnd = html.indexOf('</style>')
    const block = html.slice(styleStart, styleEnd)
    expect(block).toContain('/* base */')
  })

  it('appends options.extraHead', () => {
    const html = renderDocumentToHtml(makeDoc(), makeRegistry(), {
      extraHead: '<meta name="custom" content="x">',
    })
    expect(html).toContain('<meta name="custom" content="x">')
  })

  it('escapes the title', () => {
    const doc = makeDoc()
    doc.title = '<bad>'
    const html = renderDocumentToHtml(doc, makeRegistry())
    expect(html).toContain('<title>&lt;bad&gt;</title>')
  })
})

describe('renderSiteFiles', () => {
  function makePage(id: string, title: string, styles?: PageDocument['styles']): PageDocument {
    return {
      id,
      title,
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: `${id}-h`, type: 'heading', props: { content: title } }],
      styles,
    }
  }

  it('slugifies file names with a fallback', () => {
    expect(slugify('Site Footer!')).toBe('site-footer')
    expect(slugify('   ')).toBe('page')
    expect(slugify('', 'site')).toBe('site')
  })

  it('renders one page per file linking a shared deduped stylesheet', () => {
    const shared = { hero: { color: 'red' } }
    const files = renderSiteFiles(
      [makePage('a', 'Home', shared), makePage('b', 'About Us', { ...shared, local: { color: 'blue' } })],
      makeRegistry(),
      { baseStyles: '/* reset */' },
    )

    expect(files.map(file => file.name)).toEqual(['index.html', 'about-us.html', 'styles.css'])
    const [home, about, css] = files
    expect(home!.content).toContain('<link rel="stylesheet" href="./styles.css">')
    expect(home!.content).not.toContain('<style>')
    expect(about!.content).toContain('<title>About Us</title>')
    expect(css!.content).toContain('/* reset */')
    expect(css!.content).toContain('.local')
    // The shared class arrives from both pages but is emitted once.
    expect(css!.content.match(/\.hero\b/g)).toHaveLength(1)
  })

  it('disambiguates colliding page titles', () => {
    const files = renderSiteFiles(
      [makePage('a', 'Home'), makePage('b', 'Page'), makePage('c', 'Page')],
      makeRegistry(),
    )
    expect(files.map(file => file.name)).toEqual(['index.html', 'page.html', 'page-2.html', 'styles.css'])
  })
})

describe('renderDocumentToFragment', () => {
  it('returns html + css parts separately', () => {
    const doc: PageDocument = {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: 'h', type: 'heading', props: { content: 'Hi' }, style: { color: '#000' } }],
    }
    const { html, css } = renderDocumentToFragment(doc, makeRegistry())
    expect(html).toContain('<h2')
    // Document styles come back pretty-printed — the fragment css is meant to
    // be dropped into a stylesheet a human may read.
    expect(css).toContain('.uf-block-h {\n  color: #000;\n}')
  })
})

describe('collectBlockCss', () => {
  function registryWithCss(): BlockRegistry {
    return {
      callout: {
        type: 'callout',
        label: 'Callout',
        defaultProps: {},
        css: '.uf-callout-block { padding: 1rem }',
        renderHtml: (_b, ctx) => `<div class="${ctx.classes}"></div>`,
      } as BlockDefinition,
      container: defineContainer(),
    }
  }

  it('collects css once per used type', () => {
    const blocks = [
      { id: 'a', type: 'callout', props: {} },
      { id: 'b', type: 'callout', props: {} },
    ]
    expect(collectBlockCss(blocks, registryWithCss())).toBe('.uf-callout-block { padding: 1rem }')
  })

  it('collects block css from component slot fills', () => {
    const symbols = {
      card: {
        id: 'card',
        name: 'Card',
        root: {
          id: 'root',
          type: 'container',
          props: {},
          children: [{ id: 'slot', type: 'slot', props: { name: 'content' } }],
        },
        variants: [{ id: 'default', name: 'Default', classes: [] }],
        defaultVariantId: 'default',
        updatedAt: '',
      },
    }
    const blocks = [{
      id: 'instance',
      type: SYMBOL_INSTANCE_BLOCK_TYPE,
      props: { symbolId: 'card' },
      children: [{
        id: 'fill',
        type: '__symbol_slot_fill',
        props: { slotId: 'slot' },
        children: [{ id: 'custom', type: 'callout', props: {} }],
      }],
    }]
    expect(collectBlockCss(blocks, registryWithCss(), symbols)).toBe('.uf-callout-block { padding: 1rem }')
  })

  it('walks children and ignores types without css', () => {
    const blocks = [
      { id: 'c', type: 'container', props: {}, children: [{ id: 'a', type: 'callout', props: {} }] },
    ]
    expect(collectBlockCss(blocks, registryWithCss())).toBe('.uf-callout-block { padding: 1rem }')
  })

  it('is injected into the exported document head', () => {
    const doc: PageDocument = {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: 'a', type: 'callout', props: {} }],
    }
    const html = renderDocumentToHtml(doc, registryWithCss())
    expect(html).toContain('.uf-callout-block { padding: 1rem }')
  })
})

describe('renderDocumentBody', () => {
  it('renders only the block contents (no <html>/<body> wrappers)', () => {
    const doc: PageDocument = {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: 'h', type: 'heading', props: { content: 'Solo' } }],
    }
    const body = renderDocumentBody(doc, makeRegistry())
    expect(body).not.toContain('<html')
    expect(body).not.toContain('<body')
    expect(body).toContain('<h2>Solo</h2>')
  })
})

describe('untrusted rendering', () => {
  const doc: PageDocument = {
    id: 'p',
    title: 'p',
    version: 1,
    updatedAt: '',
    settings: { width: 'responsive', background: '#fff' },
    blocks: [{ id: 'r', type: 'raw', props: { html: '<script>steal()</script>' } }],
  }

  it('inlines raw HTML verbatim by default (trusted)', () => {
    const html = renderDocumentToHtml(doc, makeRegistry())
    expect(html).toContain('<script>steal()</script>')
  })

  it('isolates raw HTML in a sandboxed iframe when untrustedEmbeds is set', () => {
    const html = renderDocumentToHtml(doc, makeRegistry(), { untrustedEmbeds: true })
    expect(html).toContain('sandbox="allow-scripts"')
    expect(html).toContain('srcdoc="')
    // The payload is escaped inside srcdoc, so no live <script> reaches the page.
    expect(html).not.toContain('<script>steal()</script>')
  })

  it('threads the flag through renderDocumentToFragment too', () => {
    expect(renderDocumentToFragment(doc, makeRegistry()).html).toContain('<script>steal()</script>')
    expect(renderDocumentToFragment(doc, makeRegistry(), { untrustedEmbeds: true }).html).toContain('sandbox="allow-scripts"')
  })
})
