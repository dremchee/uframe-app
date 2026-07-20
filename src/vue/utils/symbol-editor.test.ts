import type { SymbolDefinition } from '@/core'
import { describe, expect, it } from 'vitest'
import { COMPONENT_SLOT_BLOCK_TYPE, SYMBOL_INSTANCE_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core'
import { cleanSymbolsAfterMasterRemoval, humanizePropertyKey, inferPublicPropertyKey, inferSymbolPropertyControl, uniqueSymbolPropertyKey } from './symbol-editor'

describe('symbol-editor', () => {
  it('infers public property metadata from authored block props', () => {
    expect(inferPublicPropertyKey('label')).toBe('text')
    expect(inferPublicPropertyKey('hero-title')).toBe('heroTitle')
    expect(humanizePropertyKey('heroTitle')).toBe('Hero Title')
    expect(inferSymbolPropertyControl('href', '/pricing')).toEqual({ type: 'url' })
    expect(inferSymbolPropertyControl('backgroundColor', '#fff')).toEqual({ type: 'color' })
    expect(inferSymbolPropertyControl('enabled', true)).toEqual({ type: 'boolean' })
  })

  it('keeps public keys unique', () => {
    const symbol = {
      id: 'card',
      name: 'Card',
      root: { id: 'root', type: 'div', props: {} },
      variants: [{ id: 'default', name: 'Default', classes: [] }],
      defaultVariantId: 'default',
      properties: [{ id: 'title', key: 'text', label: 'Text', target: { blockId: 'root', prop: 'title' }, control: { type: 'text' } }],
      updatedAt: '',
    } satisfies SymbolDefinition
    expect(uniqueSymbolPropertyKey(symbol, 'text')).toBe('text2')
  })

  it('removes stale component properties and Slot fills with their master nodes', () => {
    const symbols: Record<string, SymbolDefinition> = {
      card: {
        id: 'card',
        name: 'Card',
        root: {
          id: 'root',
          type: 'div',
          props: {},
          children: [{ id: 'slot', type: COMPONENT_SLOT_BLOCK_TYPE, props: { name: 'content' } }],
        },
        variants: [{ id: 'default', name: 'Default', classes: [] }],
        defaultVariantId: 'default',
        properties: [{ id: 'title', key: 'title', label: 'Title', target: { blockId: 'root', prop: 'title' }, control: { type: 'text' } }],
        updatedAt: '',
      },
      page: {
        id: 'page',
        name: 'Page',
        root: {
          id: 'instance',
          type: SYMBOL_INSTANCE_BLOCK_TYPE,
          props: { symbolId: 'card' },
          children: [{ id: 'fill', type: SYMBOL_SLOT_FILL_BLOCK_TYPE, props: { slotId: 'slot' } }],
        },
        variants: [{ id: 'default', name: 'Default', classes: [] }],
        defaultVariantId: 'default',
        updatedAt: '',
      },
    }

    const result = cleanSymbolsAfterMasterRemoval(symbols, new Set(['root']), new Set(['slot']))
    expect(result?.card.properties).toBeUndefined()
    expect(result?.page.root.children).toEqual([])
  })
})
