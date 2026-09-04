import { describe, expect, it } from 'vitest'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { baseBlockStylesSchema, createBlockRegistry, createPresetBlock, validateBlockProps, visitBlockTree } from '@/core'
import { en } from '@/vue/i18n/en'
import { blockMetaKey } from '@/vue/utils/block-label'

const registry = createBlockRegistry(defaultBlockDefinitions)
const cases = defaultBlockDefinitions.flatMap(definition =>
  (definition.presets ?? []).map(preset => [`${definition.type}#${preset.id}`, definition, preset] as const),
)

describe('block presets', () => {
  it('ships structural presets for the container primitive', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  it('keeps preset ids unique within a type', () => {
    for (const definition of defaultBlockDefinitions) {
      const ids = (definition.presets ?? []).map(preset => preset.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it.each(cases)('%s builds a tree of valid, registered blocks', (_key, definition, preset) => {
    const block = createPresetBlock(definition, preset, registry)
    expect(block.type).toBe(definition.type)
    visitBlockTree([block], (node) => {
      expect(registry[node.type]).toBeDefined()
      expect(validateBlockProps(node, registry)).toEqual({ success: true, errors: [] })
      if (node.style)
        expect(baseBlockStylesSchema.safeParse(node.style).success).toBe(true)
    })
  })

  it.each(cases)('%s has a translated label and description', (_key, _definition, preset) => {
    const meta = (en.blocks.presets as Record<string, { label: string, description: string }>)[blockMetaKey(preset.id)]
    expect(meta?.label).toBeTruthy()
    expect(meta?.description).toBeTruthy()
  })
})
