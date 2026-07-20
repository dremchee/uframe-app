import type { BlockDefinition } from '@/core'
import { describe, expect, it } from 'vitest'
import { blockMetaKey, displayBlockLabel, localizedBlockCategory, localizedBlockDescription, localizedBlockLabel } from './block-label'

const definition: BlockDefinition = {
  type: 'callout-box',
  label: 'Callout',
  description: 'Important content',
  defaultProps: {},
}

describe('block-label', () => {
  it('builds camel-cased catalog keys from block types', () => {
    expect(blockMetaKey('select-option')).toBe('selectOption')
  })

  it('uses catalog entries and preserves plain metadata as fallback', () => {
    const t = (key: string) => key === 'blocks.meta.calloutBox.label' ? 'Выноска' : key
    expect(localizedBlockLabel(definition.type, definition, t)).toBe('Выноска')
    expect(localizedBlockDescription(definition.type, definition, t)).toBe('Important content')
  })

  it('uses plugin keys before the default catalog', () => {
    const pluginBlock = { ...definition, labelKey: 'brand.callout', descriptionKey: 'brand.calloutHint' }
    const t = (key: string) => ({ 'brand.callout': 'Промо', 'brand.calloutHint': 'Короткое описание' }[key] ?? key)
    expect(localizedBlockLabel(pluginBlock.type, pluginBlock, t)).toBe('Промо')
    expect(localizedBlockDescription(pluginBlock.type, pluginBlock, t)).toBe('Короткое описание')
  })

  it('prefers a user-defined block name over the catalog label', () => {
    const t = (key: string) => key === 'blocks.meta.calloutBox.label' ? 'Выноска' : key
    expect(displayBlockLabel({ type: definition.type, name: 'Главный блок' }, definition, t)).toBe('Главный блок')
    expect(displayBlockLabel({ type: definition.type, name: '   ' }, definition, t)).toBe('Выноска')
  })

  it('uses a translated category with a plain fallback', () => {
    const categoryBlock = { ...definition, category: 'Basic' as const }
    const t = (key: string) => key === 'blocks.categories.Basic' ? 'Базовые' : key
    expect(localizedBlockCategory(categoryBlock, t)).toBe('Базовые')
    expect(localizedBlockCategory({ ...definition, category: undefined }, t)).toBe('Other')
  })
})
