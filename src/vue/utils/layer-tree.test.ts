import type { PageBlock, SymbolDefinition } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import {
  isVirtualSlotLayerRow,
  projectLayerTree,
  symbolSlotLayerKey,
} from '@/vue/utils/layer-tree'

function slot(id: string, name: string, children: PageBlock[] = []): PageBlock {
  return { id, type: 'slot', props: { name }, children }
}

function symbol(
  id: string,
  slots: PageBlock[],
  rootChildren: PageBlock[] = slots,
): SymbolDefinition {
  return {
    id,
    name: id,
    root: { id: `${id}-root`, type: 'div', props: {}, children: rootChildren },
    variants: [{ id: 'default', name: 'Default', classes: [] }],
    defaultVariantId: 'default',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function instance(id: string, symbolId: string, children: PageBlock[] = []): PageBlock {
  return { id, type: '__symbol', props: { symbolId }, children }
}

function fill(id: string, slotId: string, children: PageBlock[] = []): PageBlock {
  return { id, type: '__symbol_slot_fill', props: { slotId }, children }
}

describe('projectLayerTree', () => {
  it('projects regular blocks with stable parent and ancestor keys', () => {
    const blocks: PageBlock[] = [{
      id: 'section',
      type: 'section',
      props: {},
      children: [{ id: 'heading', type: 'heading', props: { content: 'Hello' } }],
    }]

    const rows = projectLayerTree(blocks, undefined)

    expect(rows.map(row => ({
      kind: row.kind,
      key: row.key,
      depth: row.depth,
      parentKey: row.parentKey,
      ancestorKeys: row.ancestorKeys,
    }))).toEqual([
      { kind: 'block', key: 'section', depth: 0, parentKey: null, ancestorKeys: [] },
      { kind: 'block', key: 'heading', depth: 1, parentKey: 'section', ancestorKeys: ['section'] },
    ])
  })

  it('shows fallback, custom and empty virtual slot rows without fill wrappers', () => {
    const component = symbol('card', [
      slot('header-slot', 'Header', [{ id: 'fallback', type: 'text', props: { content: 'Fallback' } }]),
      slot('body-slot', 'Body'),
      slot('footer-slot', 'Footer'),
    ])
    const blocks = [instance('card-instance', 'card', [
      fill('body-fill', 'body-slot', [{ id: 'custom-text', type: 'text', props: { content: 'Custom' } }]),
      fill('footer-fill', 'footer-slot'),
    ])]

    const rows = projectLayerTree(blocks, { card: component })
    const slotRows = rows.filter(isVirtualSlotLayerRow)

    expect(slotRows.map(row => ({
      key: row.key,
      name: row.name,
      fillId: row.fillId,
      hasChildren: row.hasChildren,
    }))).toEqual([
      {
        key: symbolSlotLayerKey('card-instance', 'header-slot'),
        name: 'Header',
        fillId: undefined,
        hasChildren: false,
      },
      {
        key: symbolSlotLayerKey('card-instance', 'body-slot'),
        name: 'Body',
        fillId: 'body-fill',
        hasChildren: true,
      },
      {
        key: symbolSlotLayerKey('card-instance', 'footer-slot'),
        name: 'Footer',
        fillId: 'footer-fill',
        hasChildren: false,
      },
    ])
    expect(rows.map(row => row.key)).not.toContain('body-fill')
    expect(rows.map(row => row.key)).not.toContain('footer-fill')
    expect(rows.map(row => row.key)).not.toContain('fallback')
    expect(rows.map(row => row.key)).toContain('custom-text')
  })

  it('recurses through custom content and nested component instances', () => {
    const badge = symbol('badge', [slot('badge-content', 'Content')])
    const card = symbol('card', [slot('card-content', 'Content')])
    const blocks = [instance('card-instance', 'card', [
      fill('card-fill', 'card-content', [
        {
          id: 'custom-container',
          type: 'div',
          props: {},
          children: [instance('badge-instance', 'badge')],
        },
      ]),
    ])]

    const rows = projectLayerTree(blocks, { badge, card })
    const nestedSlotKey = symbolSlotLayerKey('badge-instance', 'badge-content')
    const nestedSlot = rows.find(row => row.key === nestedSlotKey)

    expect(rows.map(row => row.key)).toEqual([
      'card-instance',
      symbolSlotLayerKey('card-instance', 'card-content'),
      'custom-container',
      'badge-instance',
      nestedSlotKey,
    ])
    expect(nestedSlot?.ancestorKeys).toEqual([
      'card-instance',
      symbolSlotLayerKey('card-instance', 'card-content'),
      'custom-container',
      'badge-instance',
    ])
  })

  it('supports collapsing real instance and virtual slot rows by their keys', () => {
    const card = symbol('card', [slot('content', 'Content')])
    const blocks = [instance('card-instance', 'card', [
      fill('content-fill', 'content', [{ id: 'custom', type: 'text', props: {} }]),
    ])]
    const slotKey = symbolSlotLayerKey('card-instance', 'content')

    expect(projectLayerTree(blocks, { card }, {
      isExpanded: key => key !== 'card-instance',
    }).map(row => row.key)).toEqual(['card-instance'])

    const collapsedSlotRows = projectLayerTree(blocks, { card }, {
      isExpanded: key => key !== slotKey,
    })
    expect(collapsedSlotRows.map(row => row.key)).toEqual(['card-instance', slotKey])
    expect(collapsedSlotRows[1]).toMatchObject({ hasChildren: true, expanded: false })
  })

  it('keeps malformed standalone wrappers transparent and preserves ordinary instance children', () => {
    const blocks: PageBlock[] = [
      fill('standalone-fill', 'missing', [{ id: 'inside', type: 'text', props: {} }]),
      instance('missing-instance', 'missing-symbol', [
        { id: 'ordinary', type: 'text', props: {} },
        fill('orphan-fill', 'missing-slot', [{ id: 'orphan-child', type: 'text', props: {} }]),
      ]),
    ]

    const rows = projectLayerTree(blocks, {})

    expect(rows.map(row => row.key)).toEqual(['inside', 'missing-instance', 'ordinary'])
    expect(rows[0]).toMatchObject({ depth: 0, parentKey: null, ancestorKeys: [] })
    expect(rows[2]).toMatchObject({ depth: 1, parentKey: 'missing-instance' })
  })

  it('builds unambiguous virtual keys and narrows slot rows', () => {
    expect(symbolSlotLayerKey('instance:one', 'slot/two')).toBe(
      'symbol-slot:instance%3Aone:slot%2Ftwo',
    )

    const card = symbol('card', [slot('content', 'Content')])
    const [blockRow, slotRow] = projectLayerTree([instance('instance', 'card')], { card })
    expect(isVirtualSlotLayerRow(blockRow)).toBe(false)
    expect(isVirtualSlotLayerRow(slotRow)).toBe(true)
  })
})
