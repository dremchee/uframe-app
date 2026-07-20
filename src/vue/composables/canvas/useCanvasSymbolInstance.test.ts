import type { PageBlock, SymbolDefinition } from '@/core'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useCanvasSymbolInstance } from './useCanvasSymbolInstance'

function symbol(): SymbolDefinition {
  return {
    id: 'card',
    name: 'Card',
    root: {
      id: 'root',
      type: 'div',
      props: {},
      children: [{ id: 'title', type: 'heading', props: { content: 'Default' } }],
    },
    variants: [{ id: 'default', name: 'Default', classes: [] }],
    defaultVariantId: 'default',
    properties: [{
      id: 'title-property',
      key: 'title',
      label: 'Title',
      target: { blockId: 'title', prop: 'content' },
      control: { type: 'text' },
    }],
    updatedAt: '',
  }
}

function instance(): PageBlock {
  return {
    id: 'instance',
    type: '__symbol',
    props: { symbolId: 'card' },
    bindings: { 'title-property': 'item.title' },
  }
}

describe('useCanvasSymbolInstance', () => {
  it('materializes resolved binding values without changing the master', () => {
    const block = ref(instance())
    const symbols = ref({ card: symbol() })
    const result = useCanvasSymbolInstance({
      block: () => block.value,
      symbols: () => symbols.value,
      ancestorSymbols: () => undefined,
      scope: () => ({ title: 'From CMS' }),
      dataContext: () => undefined,
    })

    expect(result.isSymbolInstance.value).toBe(true)
    expect(result.materializedRoot.value?.children?.[0]?.props.content).toBe('From CMS')
    expect(symbols.value.card.root.children?.[0]?.props.content).toBe('Default')
    expect(result.nestedAncestorSymbols.value).toEqual(new Set(['card']))
  })

  it('stops resolving an instance that closes a symbol cycle', () => {
    const result = useCanvasSymbolInstance({
      block: instance,
      symbols: () => ({ card: symbol() }),
      ancestorSymbols: () => new Set(['card']),
      scope: () => undefined,
      dataContext: () => undefined,
    })

    expect(result.isCircular.value).toBe(true)
    expect(result.symbol.value).toBeUndefined()
    expect(result.materializedRoot.value).toBeUndefined()
  })
})
