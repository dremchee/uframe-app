import type { GlobalSettings, PageBlock, PageDocument, SymbolDefinition } from '@/core'
import { describe, expect, it } from 'vitest'
import { BLOCK_CONVERSIONS, convertLegacyBlocks, convertLegacyGlobals } from '@/core/utils/block-conversions'

function block(type: string, children?: PageBlock[]): PageBlock {
  return { id: `${type}-1`, type, props: {}, ...(children ? { children } : {}) }
}

function doc(blocks: PageBlock[], symbols?: Record<string, SymbolDefinition>): PageDocument {
  return {
    id: 'd',
    title: 'D',
    version: 1,
    blocks,
    settings: {},
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...(symbols ? { symbols } : {}),
  } as PageDocument
}

function symbol(root: PageBlock): SymbolDefinition {
  return {
    id: 's',
    name: 'Card',
    root,
    variants: [{ id: 'v', name: 'Default', classes: [] }],
    defaultVariantId: 'v',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('convertLegacyBlocks', () => {
  it('rewrites the retired container trio to Element, carrying the tag', () => {
    const out = convertLegacyBlocks(doc([
      block('section', [block('container'), block('div')]),
    ]))

    const root = out.blocks[0]!
    expect(root.type).toBe('element')
    expect(root.props).toEqual({ tag: 'section' })
    expect(root.children?.map(child => [child.type, child.props])).toEqual([
      ['element', { tag: 'div' }],
      ['element', { tag: 'div' }],
    ])
  })

  it('renames the pre-release box type, leaving its props alone', () => {
    const out = convertLegacyBlocks(doc([
      { id: 'b', type: 'box', props: { tag: 'section' } },
    ]))
    expect(out.blocks[0]).toMatchObject({ type: 'element', props: { tag: 'section' } })
  })

  it('converts symbol masters, which carry block trees of their own', () => {
    const out = convertLegacyBlocks(doc([], { s: symbol(block('section', [block('div')])) }))

    const root = out.symbols!.s!.root
    expect(root.type).toBe('element')
    expect(root.children?.[0]?.type).toBe('element')
  })

  it('is idempotent, so every entry point may call it', () => {
    const once = convertLegacyBlocks(doc([block('section')]))
    expect(convertLegacyBlocks(once)).toEqual(once)
  })

  it('leaves a type it does not know alone', () => {
    // A plugin block whose plugin this host has not loaded. Rewriting it would
    // destroy it on the next autosave; the canvas renders it as an Element instead.
    const out = convertLegacyBlocks(doc([block('acme-carousel')]))
    expect(out.blocks[0]!.type).toBe('acme-carousel')
  })

  it('never converts a type that is live in the registry', () => {
    const out = convertLegacyBlocks(doc([block('container')]), {
      isRegistered: type => type === 'container',
    })
    expect(out.blocks[0]!.type).toBe('container')
  })

  it('applies host conversions on top of the built-ins', () => {
    const out = convertLegacyBlocks(doc([block('acme-stack')]), {
      conversions: [{ from: 'acme-stack', to: 'element', props: () => ({ tag: 'div' }), since: '1.0' }],
    })
    expect(out.blocks[0]!.type).toBe('element')
  })

  it('reports every conversion it makes', () => {
    const seen: string[] = []
    convertLegacyBlocks(doc([block('section', [block('div')])]), {
      onConvert: (from, to) => seen.push(`${from}->${to}`),
    })
    expect(seen).toEqual(['section->element', 'div->element'])
  })
})

describe('convertLegacyGlobals', () => {
  it('converts the symbol masters carried by shared globals', () => {
    const globals = {
      breakpoints: [],
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      symbols: { s: symbol(block('container')) },
    } as unknown as GlobalSettings

    expect(convertLegacyGlobals(globals).symbols!.s!.root.type).toBe('element')
  })

  it('passes globals without symbols straight through', () => {
    const globals = { breakpoints: [], version: 1, updatedAt: 'x' } as unknown as GlobalSettings
    expect(convertLegacyGlobals(globals)).toBe(globals)
  })
})

describe('the conversion table itself', () => {
  it('never maps two entries from the same retired type', () => {
    const froms = BLOCK_CONVERSIONS.map(conversion => conversion.from)
    expect(new Set(froms).size).toBe(froms.length)
  })

  it('never chains: no target is itself retired', () => {
    const froms = new Set(BLOCK_CONVERSIONS.map(conversion => conversion.from))
    expect(BLOCK_CONVERSIONS.filter(conversion => froms.has(conversion.to))).toEqual([])
  })
})
