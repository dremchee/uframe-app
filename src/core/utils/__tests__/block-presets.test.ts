import type { BlockDefinition, BlockRegistry } from '@/core/types/block-registry'
import { describe, expect, it } from 'vitest'
import { createPresetBlock, findBlockPreset, instantiateBlock } from '@/core/utils/block-presets'

const element: BlockDefinition = {
  type: 'element',
  label: 'Element',
  defaultProps: { tag: 'div' },
  acceptsChildren: true,
  presets: [
    {
      id: 'v-stack',
      label: 'V Stack',
      style: { display: 'flex', flexDirection: 'column', gap: '16px' },
    },
    {
      id: 'grid',
      label: 'Grid',
      props: { tag: 'section' },
      style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
      children: [
        { type: 'element', style: { minHeight: '80px' } },
        { type: 'element', children: [{ type: 'missing' }, { type: 'text', props: { content: 'Hi' } }] },
        { type: 'missing' },
      ],
    },
  ],
}

const text: BlockDefinition = {
  type: 'text',
  label: 'Text',
  defaultProps: { content: '' },
  defaultStyle: { fontSize: '16px' },
}

const registry: BlockRegistry = { element, text }

describe('createPresetBlock', () => {
  it('merges preset props and styles over the definition defaults', () => {
    const block = createPresetBlock(element, element.presets![1]!, registry)
    expect(block.type).toBe('element')
    expect(block.name).toBe('Grid')
    expect(block.props).toEqual({ tag: 'section' })
    expect(block.style).toEqual({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' })
  })

  it('leaves style undefined when neither the preset nor the definition sets one', () => {
    const block = createPresetBlock(text, { id: 'plain', label: 'Plain' }, registry)
    // defaultStyle still applies — the preset only adds on top.
    expect(block.style).toEqual({ fontSize: '16px' })
    const bare = createPresetBlock(element, { id: 'bare', label: 'Bare' }, registry)
    expect(bare.style).toBeUndefined()
    expect(bare.children).toBeUndefined()
  })

  it('builds the starter subtree with fresh ids and skips unknown child types', () => {
    const block = createPresetBlock(element, element.presets![1]!, registry)
    expect(block.children).toHaveLength(2)
    const [first, second] = block.children!
    expect(first!.style).toEqual({ minHeight: '80px' })
    expect(second!.children).toHaveLength(1)
    expect(second!.children![0]!.props).toEqual({ content: 'Hi' })
    expect(second!.children![0]!.style).toEqual({ fontSize: '16px' })
    const ids = new Set([block.id, first!.id, second!.id, second!.children![0]!.id])
    expect(ids.size).toBe(4)
  })

  it('does not share style objects between the preset and the block', () => {
    const block = createPresetBlock(element, element.presets![0]!, registry)
    ;(block.style as Record<string, unknown>).gap = '0px'
    expect(element.presets![0]!.style!.gap).toBe('16px')
  })
})

describe('instantiateBlock', () => {
  it('resolves a preset by id', () => {
    const block = instantiateBlock(registry, 'element', 'v-stack')
    expect(block?.style).toEqual({ display: 'flex', flexDirection: 'column', gap: '16px' })
  })

  it('falls back to the plain block for an unknown preset id', () => {
    const block = instantiateBlock(registry, 'element', 'nope')
    expect(block?.type).toBe('element')
    expect(block?.style).toBeUndefined()
  })

  it('returns undefined for an unregistered type', () => {
    expect(instantiateBlock(registry, 'missing', 'v-stack')).toBeUndefined()
  })

  it('findBlockPreset tolerates missing definitions and ids', () => {
    expect(findBlockPreset(undefined, 'grid')).toBeUndefined()
    expect(findBlockPreset(element, undefined)).toBeUndefined()
    expect(findBlockPreset(element, 'grid')?.id).toBe('grid')
  })
})
