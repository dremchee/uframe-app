import type { BlockDefinition, BlockRegistry } from '@/core/types/block-registry'
import type { UframePlugin } from '@/core/utils/plugin'
import { describe, expect, it } from 'vitest'
import { applyPlugins, collectPanels, collectPluginBlocks, collectToolbarSlots, definePlugin, mergeStyleTokens } from '@/core/utils/plugin'

// Minimal stand-in — the helpers only ever read `.type`.
function def(type: string, label = type): BlockDefinition {
  return { type, label } as unknown as BlockDefinition
}

describe('collectPluginBlocks', () => {
  it('flattens blocks across plugins in order', () => {
    const plugins: UframePlugin[] = [
      { name: 'a', blocks: [def('x'), def('y')] },
      { name: 'b', blocks: [def('z')] },
      { name: 'c' },
    ]
    expect(collectPluginBlocks(plugins).map(b => b.type)).toEqual(['x', 'y', 'z'])
  })

  it('handles undefined', () => {
    expect(collectPluginBlocks(undefined)).toEqual([])
  })
})

describe('applyPlugins', () => {
  const base: BlockRegistry = { heading: def('heading'), text: def('text') }

  it('adds plugin blocks without mutating the base', () => {
    const merged = applyPlugins(base, [{ name: 'p', blocks: [def('chart')] }])
    expect(Object.keys(merged).sort()).toEqual(['chart', 'heading', 'text'])
    expect(Object.keys(base).sort()).toEqual(['heading', 'text']) // untouched
  })

  it('lets plugins override a base type (last-wins)', () => {
    const custom = def('heading', 'Custom heading')
    const merged = applyPlugins(base, [{ name: 'p', blocks: [custom] }])
    expect(merged.heading.label).toBe('Custom heading')
  })

  it('lets a later plugin override an earlier one', () => {
    const merged = applyPlugins(base, [
      { name: 'first', blocks: [def('card', 'First')] },
      { name: 'second', blocks: [def('card', 'Second')] },
    ])
    expect(merged.card.label).toBe('Second')
  })

  it('returns a copy of the base when no plugins', () => {
    const merged = applyPlugins(base, undefined)
    expect(merged).toEqual(base)
    expect(merged).not.toBe(base)
  })
})

describe('mergeStyleTokens', () => {
  it('merges token maps with later plugins winning', () => {
    const tokens = mergeStyleTokens([
      { name: 'a', styleTokens: { accent: 'red', radius: '4px' } },
      { name: 'b', styleTokens: { accent: 'blue' } },
      { name: 'c' },
    ])
    expect(tokens).toEqual({ accent: 'blue', radius: '4px' })
  })

  it('handles undefined', () => {
    expect(mergeStyleTokens(undefined)).toEqual({})
  })
})

describe('collectToolbarSlots', () => {
  it('flattens components per side in order', () => {
    const plugins = [
      { name: 'a', toolbarSlots: { left: ['L1'], right: ['R1'] } },
      { name: 'b', toolbarSlots: { right: ['R2'] } },
      { name: 'c' },
    ]
    expect(collectToolbarSlots(plugins, 'left')).toEqual(['L1'])
    expect(collectToolbarSlots(plugins, 'right')).toEqual(['R1', 'R2'])
  })

  it('handles undefined and missing sides', () => {
    expect(collectToolbarSlots(undefined, 'left')).toEqual([])
    expect(collectToolbarSlots([{ name: 'x' }], 'right')).toEqual([])
  })
})

describe('collectPanels', () => {
  it('flattens panels across plugins in order', () => {
    const plugins = [
      { name: 'a', panels: [{ id: 'assets', label: 'Assets', icon: 'I', component: 'C' }] },
      { name: 'b' },
      { name: 'c', panels: [{ id: 'seo', label: 'SEO', icon: 'I2', component: 'C2' }] },
    ]
    expect(collectPanels(plugins).map(p => p.id)).toEqual(['assets', 'seo'])
  })

  it('handles undefined', () => {
    expect(collectPanels(undefined)).toEqual([])
  })
})

describe('definePlugin', () => {
  it('returns the plugin unchanged', () => {
    const p = definePlugin({ name: 'x' })
    expect(p).toEqual({ name: 'x' })
  })
})
