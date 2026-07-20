import type { PageBlock } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createBlockRegistry, createPageDocument } from '@/core/utils/document-tree'
import {
  formatValidationErrors,
  validateBlockProps,
  validateComponentSlots,
  validateDocumentBlocks,
  validatePageDocument,
} from '@/core/utils/validation'

const headingDef = {
  type: 'heading',
  label: 'Heading',
  defaultProps: { content: '' },
  propsSchema: z.object({
    content: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }),
  renderComponent: {},
}

describe('validatePageDocument', () => {
  it('passes for documents built via createPageDocument', () => {
    const doc = createPageDocument({ title: 'OK' })
    expect(validatePageDocument(doc).success).toBe(true)
  })

  it('accepts optional user-defined block names', () => {
    const doc = createPageDocument({
      blocks: [{ id: 'hero-title', type: 'heading', name: 'Hero title', props: { content: 'Welcome' } }],
    })
    expect(validatePageDocument(doc).success).toBe(true)
  })

  it('accepts intermediate variable-font weights', () => {
    const doc = createPageDocument({
      blocks: [{ id: 'hero-title', type: 'heading', props: { content: 'Welcome' }, style: { fontWeight: 650 } }],
    })
    expect(validatePageDocument(doc).success).toBe(true)
  })

  it('reports issues for malformed documents', () => {
    const result = validatePageDocument({ id: '', title: 'X', version: -1, blocks: [], settings: {}, updatedAt: '' })
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateBlockProps', () => {
  it('accepts props matching the schema', () => {
    const registry = createBlockRegistry([headingDef])
    const block: PageBlock = { id: 'h', type: 'heading', props: { content: 'Hi', level: 2 } }
    const result = validateBlockProps(block, registry)
    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('returns errors for invalid props', () => {
    const registry = createBlockRegistry([headingDef])
    const block: PageBlock = { id: 'h', type: 'heading', props: { content: 42 } as never }
    const result = validateBlockProps(block, registry)
    expect(result.success).toBe(false)
    expect(result.errors.join('\n')).toMatch(/content/)
  })

  it('reports unknown block types', () => {
    const registry = createBlockRegistry([headingDef])
    const block: PageBlock = { id: 'h', type: 'mystery', props: {} }
    const result = validateBlockProps(block, registry)
    expect(result.success).toBe(false)
    expect(result.errors[0]).toMatch(/Unknown block type/)
  })

  it('skips validation when a block has no propsSchema', () => {
    const registry = createBlockRegistry([{
      type: 'neutral',
      label: 'Neutral',
      defaultProps: {},
      element: 'uf-neutral',
    }])
    const block: PageBlock = { id: 'n', type: 'neutral', props: { anything: 123 } }
    const result = validateBlockProps(block, registry)
    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
  })
})

describe('validateDocumentBlocks', () => {
  it('walks the whole tree (children included)', () => {
    const registry = createBlockRegistry([headingDef, {
      type: 'container',
      label: 'Container',
      defaultProps: {},
      propsSchema: z.object({}),
      renderComponent: {},
      acceptsChildren: true,
    }])

    const doc = createPageDocument({
      blocks: [
        {
          id: 'c',
          type: 'container',
          props: {},
          children: [
            { id: 'good', type: 'heading', props: { content: 'OK' } },
            { id: 'bad', type: 'heading', props: { content: 1 } as never },
          ],
        },
      ],
    })

    const result = validateDocumentBlocks(doc, registry)
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.startsWith('bad:'))).toBe(true)
  })
})

describe('validateComponentSlots', () => {
  it('accepts named Slots in a master and a matching instance fill', () => {
    const document = {
      ...createPageDocument(),
      symbols: {
        card: {
          id: 'card',
          name: 'Card',
          root: { id: 'root', type: 'div', props: {}, children: [{ id: 'content', type: 'slot', props: { name: 'content' } }] },
          variants: [{ id: 'default', name: 'Default', classes: [] }],
          defaultVariantId: 'default',
          updatedAt: '',
        },
      },
      blocks: [{
        id: 'instance',
        type: '__symbol',
        props: { symbolId: 'card' },
        children: [{ id: 'fill', type: '__symbol_slot_fill', props: { slotId: 'content' }, children: [] }],
      }],
    }
    expect(validateComponentSlots(document)).toEqual({ success: true, errors: [] })
  })

  it('rejects page Slots, duplicate names, nested Slots and orphan fills', () => {
    const document = {
      ...createPageDocument(),
      symbols: {
        card: {
          id: 'card',
          name: 'Card',
          root: {
            id: 'root',
            type: 'div',
            props: {},
            children: [
              { id: 'slot-a', type: 'slot', props: { name: 'content' }, children: [{ id: 'nested', type: 'slot', props: { name: 'nested' } }] },
              { id: 'slot-b', type: 'slot', props: { name: 'content' } },
            ],
          },
          variants: [{ id: 'default', name: 'Default', classes: [] }],
          defaultVariantId: 'default',
          updatedAt: '',
        },
      },
      blocks: [
        { id: 'page-slot', type: 'slot', props: { name: 'page' } },
        {
          id: 'instance',
          type: '__symbol',
          props: { symbolId: 'card' },
          children: [{ id: 'orphan', type: '__symbol_slot_fill', props: { slotId: 'gone' } }],
        },
      ],
    }
    const result = validateComponentSlots(document)
    expect(result.success).toBe(false)
    expect(result.errors.join('\n')).toContain('only valid inside component masters')
    expect(result.errors.join('\n')).toContain('duplicate Slot name')
    expect(result.errors.join('\n')).toContain('cannot be nested')
    expect(result.errors.join('\n')).toContain('unknown slot')
  })
})

describe('formatValidationErrors', () => {
  it('keeps malformed external issues from escaping the formatter', () => {
    expect(formatValidationErrors({ issues: [{}] })).toEqual(['Unknown validation error'])
  })

  it('formats zod issue paths + messages', () => {
    const errors = formatValidationErrors({
      issues: [
        { path: ['settings', 'background'], message: 'Required' },
        { path: [], message: 'Top level' },
      ],
    })
    expect(errors[0]).toBe('settings.background: Required')
    expect(errors[1]).toBe('document: Top level')
  })

  it('falls back gracefully for non-zod errors', () => {
    expect(formatValidationErrors(new Error('boom'))).toEqual(['Unknown validation error'])
  })
})
