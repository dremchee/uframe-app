import type { PageBlock, SymbolDefinition } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'
import { COMPONENT_SLOT_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core/types/page-document'
import { uniqueSymbolSlotName } from '@/core/utils/symbol-slots'
import { blockWouldCreateSymbolCycle, materializeSymbolInstance, symbolDependsOn } from '@/core/utils/symbols'

function symbol(): SymbolDefinition {
  return {
    id: 'sym_button',
    name: 'Button',
    root: {
      id: 'root',
      type: 'div',
      props: {},
      children: [{ id: 'button', type: 'button', props: { label: 'Default', href: '#' } }],
    },
    variants: [{ id: 'default', name: 'Default', classes: [] }, { id: 'primary', name: 'Primary', classes: ['primary'] }],
    defaultVariantId: 'default',
    properties: [
      { id: 'prop_text', key: 'text', label: 'Text', target: { blockId: 'button', prop: 'label' }, control: { type: 'text' } },
      { id: 'prop_url', key: 'url', label: 'URL', target: { blockId: 'button', prop: 'href' }, control: { type: 'url' } },
    ],
    updatedAt: '',
  }
}

function instance(props: Record<string, unknown> = {}): PageBlock {
  return { id: 'instance', type: '__symbol', props: { symbolId: 'sym_button', ...props } }
}

function dependencySymbols(): Record<string, SymbolDefinition> {
  return {
    a: { ...symbol(), id: 'a', root: { id: 'a-root', type: 'div', props: {}, children: [{ id: 'a-b', type: '__symbol', props: { symbolId: 'b' } }] } },
    b: { ...symbol(), id: 'b', root: { id: 'b-root', type: 'div', props: {}, children: [{ id: 'b-c', type: '__symbol', props: { symbolId: 'c' } }] } },
    c: { ...symbol(), id: 'c', root: { id: 'c-root', type: 'div', props: {} } },
  }
}

describe('symbol dependency guards', () => {
  it('finds direct and transitive symbol dependencies', () => {
    const symbols = dependencySymbols()
    expect(symbolDependsOn(symbols, 'a', 'b')).toBe(true)
    expect(symbolDependsOn(symbols, 'a', 'c')).toBe(true)
    expect(symbolDependsOn(symbols, 'b', 'a')).toBe(false)
    expect(symbolDependsOn(symbols, 'missing', 'a')).toBe(false)
  })

  it('detects block trees that would create a component cycle', () => {
    const symbols = dependencySymbols()
    const nested = { id: 'nested', type: '__symbol', props: { symbolId: 'a' } }
    const plain = { id: 'plain', type: 'div', props: {} }

    expect(blockWouldCreateSymbolCycle(nested, 'c', symbols)).toBe(true)
    expect(blockWouldCreateSymbolCycle(plain, 'c', symbols)).toBe(false)
  })
})

describe('uniqueSymbolSlotName', () => {
  it('normalizes the preferred name and avoids existing Slot names', () => {
    const source = symbol()
    source.root.children = [
      { id: 'slot-1', type: COMPONENT_SLOT_BLOCK_TYPE, props: { name: 'content' } },
      { id: 'slot-2', type: COMPONENT_SLOT_BLOCK_TYPE, props: { name: 'content-2' } },
    ]

    expect(uniqueSymbolSlotName(source, ' Content ')).toBe('content-3')
    expect(uniqueSymbolSlotName(source, '123')).toBe('content-3')
  })
})

describe('materializeSymbolInstance', () => {
  it('keeps master defaults when the instance has no overrides', () => {
    const source = symbol()
    const result = materializeSymbolInstance(instance(), source)
    expect(result.root.children?.[0]?.props).toEqual({ label: 'Default', href: '#' })
    expect(result.root).toBe(source.root)
  })

  it('forwards instance values into their target props without mutating the master', () => {
    const source = symbol()
    const result = materializeSymbolInstance(instance({
      propertyValues: { prop_text: 'Buy now', prop_url: '/buy' },
    }), source)

    expect(result.root.children?.[0]?.props).toEqual({ label: 'Buy now', href: '/buy' })
    expect(source.root.children?.[0]?.props).toEqual({ label: 'Default', href: '#' })
  })

  it('ignores overrides stored under public property keys', () => {
    const source = symbol()
    const result = materializeSymbolInstance(instance({
      propertyValues: { text: 'Public key value' },
    }), source)

    expect(result.root.children?.[0]?.props).toEqual({ label: 'Default', href: '#' })
  })

  it('lets caller-resolved binding values win over authored values', () => {
    const result = materializeSymbolInstance(
      instance({ propertyValues: { prop_text: 'Authored' } }),
      symbol(),
      { propertyValues: { prop_text: 'From CMS' } },
    )
    expect(result.root.children?.[0]?.props.label).toBe('From CMS')
  })

  it('composes variant classes with property overrides', () => {
    const result = materializeSymbolInstance(
      instance({ variantId: 'primary', propertyValues: { prop_text: 'Primary CTA' } }),
      symbol(),
    )
    expect(result.root.classes).toEqual(['primary'])
    expect(result.root.children?.[0]?.props.label).toBe('Primary CTA')
  })

  it('reports missing targets and continues rendering', () => {
    const source = symbol()
    source.properties = [{
      id: 'missing',
      key: 'missing',
      label: 'Missing',
      target: { blockId: 'gone', prop: 'value' },
      control: { type: 'text' },
    }]
    const result = materializeSymbolInstance(instance({ propertyValues: { missing: 'x' } }), source)
    expect(result.root).toBe(source.root)
    expect(result.diagnostics).toMatchObject([{ code: 'missing-property-target', blockId: 'gone' }])
  })

  it('uses Slot children as fallback when the instance has no fill', () => {
    const source = symbol()
    source.properties = []
    source.root.children = [{
      id: 'content-slot',
      type: COMPONENT_SLOT_BLOCK_TYPE,
      props: { name: 'content' },
      children: [{ id: 'fallback', type: 'text', props: { content: 'Fallback' } }],
    }]

    const result = materializeSymbolInstance(instance(), source)
    expect(result.root.children?.[0]?.children?.[0]?.id).toBe('fallback')
    expect(result.slots).toEqual([{ slotId: 'content-slot', name: 'content', state: 'fallback' }])
    expect(result.instanceOwnedBlockIds.size).toBe(0)
  })

  it('replaces Slot fallback with instance-owned fill children', () => {
    const source = symbol()
    source.properties = []
    source.root.children = [{
      id: 'content-slot',
      type: COMPONENT_SLOT_BLOCK_TYPE,
      props: { name: 'content' },
      children: [{ id: 'fallback', type: 'text', props: { content: 'Fallback' } }],
    }]
    const filled = instance()
    filled.children = [{
      id: 'fill-content',
      type: SYMBOL_SLOT_FILL_BLOCK_TYPE,
      props: { slotId: 'content-slot' },
      children: [{ id: 'custom', type: 'text', props: { content: 'Custom' } }],
    }]

    const result = materializeSymbolInstance(filled, source)
    expect(result.root.children?.[0]?.children?.map(block => block.id)).toEqual(['custom'])
    expect(result.slots).toEqual([{
      slotId: 'content-slot',
      name: 'content',
      state: 'custom',
      fillId: 'fill-content',
    }])
    expect(result.instanceOwnedBlockIds).toEqual(new Set(['custom']))
    expect(source.root.children?.[0]?.children?.[0]?.id).toBe('fallback')
  })

  it('distinguishes an explicitly empty fill from fallback', () => {
    const source = symbol()
    source.properties = []
    source.root.children = [{
      id: 'actions-slot',
      type: COMPONENT_SLOT_BLOCK_TYPE,
      props: { name: 'actions' },
      children: [{ id: 'fallback-button', type: 'button', props: { label: 'Continue', href: '#' } }],
    }]
    const empty = instance()
    empty.children = [{
      id: 'fill-actions',
      type: SYMBOL_SLOT_FILL_BLOCK_TYPE,
      props: { slotId: 'actions-slot' },
      children: [],
    }]

    const result = materializeSymbolInstance(empty, source)
    expect(result.root.children?.[0]?.children).toEqual([])
    expect(result.slots[0]).toMatchObject({ state: 'empty', fillId: 'fill-actions' })
  })

  it('reports orphan and duplicate fills without breaking valid slot content', () => {
    const source = symbol()
    source.properties = []
    source.root.children = [{
      id: 'content-slot',
      type: COMPONENT_SLOT_BLOCK_TYPE,
      props: { name: 'content' },
    }]
    const filled = instance()
    filled.children = [
      { id: 'fill-a', type: SYMBOL_SLOT_FILL_BLOCK_TYPE, props: { slotId: 'content-slot' }, children: [] },
      { id: 'fill-b', type: SYMBOL_SLOT_FILL_BLOCK_TYPE, props: { slotId: 'content-slot' }, children: [] },
      { id: 'fill-gone', type: SYMBOL_SLOT_FILL_BLOCK_TYPE, props: { slotId: 'gone' }, children: [] },
    ]

    const result = materializeSymbolInstance(filled, source)
    expect(result.diagnostics.map(diagnostic => diagnostic.code)).toEqual([
      'duplicate-slot-fill',
      'orphan-slot-fill',
    ])
  })
})

describe('symbol property i18n metadata', () => {
  it('rejects symbols without an explicit default variant', () => {
    const result = pageDocumentSchema.safeParse({
      id: 'page',
      title: 'Page',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [],
      symbols: {
        card: {
          id: 'card',
          name: 'Card',
          root: { id: 'root', type: 'div', props: {} },
          updatedAt: '',
        },
      },
    })
    expect(result.success).toBe(false)
  })

  it('preserves localization keys through document validation', () => {
    const parsed = pageDocumentSchema.parse({
      id: 'page',
      title: 'Page',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [],
      symbols: {
        card: {
          id: 'card',
          name: 'Card',
          root: { id: 'root', type: 'div', props: {} },
          variants: [{ id: 'default', name: 'Default', classes: [] }],
          defaultVariantId: 'default',
          updatedAt: '',
          properties: [{
            id: 'title',
            key: 'title',
            label: 'Title',
            labelKey: 'card.title',
            target: { blockId: 'root', prop: 'title' },
            control: {
              type: 'select',
              placeholder: 'Select',
              placeholderKey: 'card.select',
              options: [{ label: 'Primary', labelKey: 'card.primary', value: 'primary' }],
            },
          }],
        },
      },
    })
    const property = parsed.symbols?.card.properties?.[0]
    expect(property?.labelKey).toBe('card.title')
    expect(property?.control.placeholderKey).toBe('card.select')
    expect(property?.control.options?.[0]?.labelKey).toBe('card.primary')
  })
})
