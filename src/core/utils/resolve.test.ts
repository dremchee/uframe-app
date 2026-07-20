import type { PageBlock, PageDocument } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import {
  DATA_ITEM_BLOCK_TYPE,
  DATA_LIST_BLOCK_TYPE,
} from '@/core/types/page-document'
import { baseBlockId, collectDataRequirements, findDataScopeCollection } from '@/core/utils/data-blocks'
import { resolveBindingPath, resolveDocument } from '@/core/utils/resolve'

function doc(blocks: PageBlock[]): PageDocument {
  return {
    id: 'p1',
    title: 'Test',
    version: 1,
    blocks,
    settings: { width: 'responsive', background: '#fff' },
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('baseBlockId', () => {
  it('returns normal ids unchanged', () => {
    expect(baseBlockId('heading_abc-123')).toBe('heading_abc-123')
    expect(baseBlockId('demo-card')).toBe('demo-card')
  })

  it('strips a single per-row instance suffix', () => {
    expect(baseBlockId('demo-card~2')).toBe('demo-card')
  })

  it('strips stacked suffixes from nested repeats', () => {
    expect(baseBlockId('demo-card~1~3')).toBe('demo-card')
  })

  it('only strips a trailing ~<digits> run, not interior tildes', () => {
    expect(baseBlockId('weird~name~2')).toBe('weird~name')
  })
})

describe('resolveBindingPath', () => {
  it('reads rooted item/page paths and traverses relations', () => {
    const scope = { item: { title: 'Hi', author: { name: 'Ada' } }, page: { title: 'Home' } }
    expect(resolveBindingPath('item.title', scope)).toBe('Hi')
    expect(resolveBindingPath('item.author.name', scope)).toBe('Ada')
    expect(resolveBindingPath('page.title', scope)).toBe('Home')
  })

  it('returns undefined for unrooted or missing paths', () => {
    const scope = { item: { title: 'Hi' } }
    expect(resolveBindingPath('title', scope)).toBeUndefined() // no item./page. prefix
    expect(resolveBindingPath('item.missing', scope)).toBeUndefined()
    expect(resolveBindingPath('item.a.b', scope)).toBeUndefined()
    expect(resolveBindingPath('page.title', scope)).toBeUndefined()
  })
})

describe('resolveDocument — bindings', () => {
  it('overrides bound props from the item scope, strips bindings', () => {
    const out = resolveDocument(
      doc([{ id: 'h', type: 'heading', props: { content: 'fallback' }, bindings: { content: 'item.title' } }]),
      { item: { title: 'Real Title' } },
    )
    expect(out.blocks[0]!.props).toEqual({ content: 'Real Title' })
    expect(out.blocks[0]!.bindings).toBeUndefined()
  })

  it('keeps the authored fallback when the path does not resolve', () => {
    const out = resolveDocument(
      doc([{ id: 'h', type: 'heading', props: { content: 'fallback' }, bindings: { content: 'item.title' } }]),
      { item: {} },
    )
    expect(out.blocks[0]!.props).toEqual({ content: 'fallback' })
  })

  it('writes symbol bindings into propertyValues and preserves authored overrides', () => {
    const out = resolveDocument(
      doc([{
        id: 'instance',
        type: '__symbol',
        props: {
          symbolId: 'sym_button',
          propertyValues: { prop_text: 'Fallback', prop_url: '/fallback' },
        },
        bindings: { prop_text: 'item.title' },
      }]),
      { item: { title: 'From CMS' } },
    )

    expect(out.blocks[0]!.props).toEqual({
      symbolId: 'sym_button',
      propertyValues: { prop_text: 'From CMS', prop_url: '/fallback' },
    })
    expect(out.blocks[0]!.props).not.toHaveProperty('prop_text')
    expect(out.blocks[0]!.bindings).toBeUndefined()
  })

  it('does not mutate the source document', () => {
    const input = doc([{ id: 'h', type: 'heading', props: { content: 'fallback' }, bindings: { content: 'item.title' } }])
    resolveDocument(input, { item: { title: 'X' } })
    expect(input.blocks[0]!.props).toEqual({ content: 'fallback' })
    expect(input.blocks[0]!.bindings).toEqual({ content: 'item.title' })
  })
})

describe('resolveDocument — assets', () => {
  it('resolves a block asset into props.src and strips the descriptor', () => {
    const out = resolveDocument(
      doc([{ id: 'img', type: 'image', props: { src: '', alt: '' }, asset: { source: 'directus', id: 'file-1' } }]),
      { resolveAsset: ref => `https://cdn/${ref.id}.jpg` },
    )
    expect(out.blocks[0]!.props).toMatchObject({ src: 'https://cdn/file-1.jpg' })
    expect(out.blocks[0]!.asset).toBeUndefined()
  })

  it('keeps the authored src when no resolver is supplied or it returns undefined', () => {
    const block = { id: 'img', type: 'image', props: { src: 'https://ext/a.jpg' }, asset: { source: 'directus', id: 'x' } }
    expect(resolveDocument(doc([{ ...block }])).blocks[0]!.props).toEqual({ src: 'https://ext/a.jpg' })
    expect(
      resolveDocument(doc([{ ...block }]), { resolveAsset: () => undefined }).blocks[0]!.props,
    ).toEqual({ src: 'https://ext/a.jpg' })
  })

  it('an asset wins over a bound src', () => {
    const out = resolveDocument(
      doc([{ id: 'img', type: 'image', props: { src: '' }, bindings: { src: 'item.cover' }, asset: { source: 'd', id: '9' } }]),
      { item: { cover: 'bound.jpg' }, resolveAsset: ref => `asset-${ref.id}.jpg` },
    )
    expect(out.blocks[0]!.props).toEqual({ src: 'asset-9.jpg' })
  })

  it('resolves assets inside data-list per-row copies', () => {
    const out = resolveDocument(
      doc([{
        id: 'list',
        type: DATA_LIST_BLOCK_TYPE,
        props: {},
        source: { collection: 'posts' },
        children: [{ id: 'img', type: 'image', props: { src: '' }, asset: { source: 'd', id: 'logo' } }],
      }]),
      { data: { list: [{}, {}] }, resolveAsset: ref => `cdn/${ref.id}` },
    )
    expect(out.blocks[0]!.children).toHaveLength(2)
    for (const copy of out.blocks[0]!.children!) {
      expect(copy.props).toMatchObject({ src: 'cdn/logo' })
      expect(copy.asset).toBeUndefined()
    }
  })
})

describe('resolveDocument — data-item', () => {
  it('binds children against the single fetched record', () => {
    const out = resolveDocument(
      doc([{
        id: 's1',
        type: DATA_ITEM_BLOCK_TYPE,
        props: {},
        source: { collection: 'home' },
        children: [{ id: 'h', type: 'heading', props: { content: '' }, bindings: { content: 'item.heroTitle' } }],
      }]),
      { data: { s1: { heroTitle: 'Welcome' } } },
    )
    expect(out.blocks[0]!.children![0]!.props).toEqual({ content: 'Welcome' })
    expect(out.blocks[0]!.source).toBeUndefined()
  })
})

describe('resolveDocument — data-list', () => {
  const template: PageBlock = {
    id: 'r1',
    type: DATA_LIST_BLOCK_TYPE,
    props: {},
    source: { collection: 'blog', limit: 9 },
    children: [{ id: 'card', type: 'heading', props: { content: '' }, bindings: { content: 'item.title' } }],
  }

  it('expands the template once per row with unique ids', () => {
    const out = resolveDocument(doc([template]), {
      data: { r1: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] },
    })
    const cards = out.blocks[0]!.children!
    expect(cards.map(c => (c.props as { content: string }).content)).toEqual(['A', 'B', 'C'])
    expect(cards.map(c => c.id)).toEqual(['card~0', 'card~1', 'card~2'])
    expect(out.blocks[0]!.source).toBeUndefined()
  })

  it('produces an empty list when no rows are provided', () => {
    const out = resolveDocument(doc([template]), {})
    expect(out.blocks[0]!.children).toEqual([])
  })

  it('exposes page scope inside rows', () => {
    const listWithPage: PageBlock = {
      ...template,
      children: [{ id: 'card', type: 'heading', props: { content: '' }, bindings: { content: 'page.siteName' } }],
    }
    const out = resolveDocument(doc([listWithPage]), {
      page: { siteName: 'uframe' },
      data: { r1: [{ title: 'A' }, { title: 'B' }] },
    })
    const cards = out.blocks[0]!.children!
    expect(cards.map(c => (c.props as { content: string }).content)).toEqual(['uframe', 'uframe'])
  })
})

describe('findDataScopeCollection', () => {
  const tree: PageBlock[] = [
    {
      id: 'list',
      type: DATA_LIST_BLOCK_TYPE,
      props: {},
      source: { collection: 'blog' },
      children: [
        { id: 'card', type: 'div', props: {}, children: [{ id: 'title', type: 'heading', props: {} }] },
      ],
    },
    { id: 'loose', type: 'heading', props: {} },
  ]

  it('returns the nearest enclosing collection, null outside any', () => {
    expect(findDataScopeCollection(tree, 'title')).toBe('blog')
    expect(findDataScopeCollection(tree, 'card')).toBe('blog')
    expect(findDataScopeCollection(tree, 'loose')).toBeNull()
    expect(findDataScopeCollection(tree, 'missing')).toBeNull()
  })
})

describe('collectDataRequirements', () => {
  it('collects list/item sources and skips list templates', () => {
    const reqs = collectDataRequirements(doc([
      {
        id: 'r1',
        type: DATA_LIST_BLOCK_TYPE,
        props: {},
        source: { collection: 'blog', limit: 9 },
        // nested source inside the per-row template must be ignored (v2)
        children: [{ id: 'nested', type: DATA_LIST_BLOCK_TYPE, props: {}, source: { collection: 'tags' } }],
      },
      {
        id: 's1',
        type: DATA_ITEM_BLOCK_TYPE,
        props: {},
        source: { collection: 'home' },
        children: [{ id: 'inner', type: DATA_ITEM_BLOCK_TYPE, props: {}, source: { collection: 'settings' } }],
      },
    ]))

    expect(reqs).toEqual([
      { blockId: 'r1', kind: 'list', source: { collection: 'blog', limit: 9 } },
      { blockId: 's1', kind: 'item', source: { collection: 'home' } },
      { blockId: 'inner', kind: 'item', source: { collection: 'settings' } },
    ])
  })
})
