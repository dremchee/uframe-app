import type { PageBlock } from '@/core'
import { describe, expect, it } from 'vitest'
import { canRemoveLayoutCell } from '@/vue/utils/quick-layout-cell'

const empty: PageBlock = { id: 'cell', type: 'element', props: { tag: 'div' } }

describe('quick layout cell removal', () => {
  it('allows plain empty cells', () => {
    expect(canRemoveLayoutCell(empty)).toBe(true)
    expect(canRemoveLayoutCell({ ...empty, props: {}, children: [] })).toBe(true)
    expect(canRemoveLayoutCell(undefined)).toBe(false)
  })

  it.each(['text', 'image', 'placeholder', 'symbol-instance', 'slot'])('preserves %s even without children', (type) => {
    expect(canRemoveLayoutCell({ ...empty, type })).toBe(false)
  })

  it.each<Partial<PageBlock>>([
    { children: [{ id: 'text', type: 'text', props: { content: 'Keep me' } }] },
    { props: { tag: 'section' } },
    { props: { tag: 'div', content: 'Keep me' } },
    { name: 'Hero' },
    { style: { backgroundColor: 'red' } },
    { classes: ['hero'] },
    { attributes: { 'aria-label': 'Hero' } },
    { htmlId: 'anchor' },
    { hidden: true },
    { bindings: { tag: 'item.tag' } },
  ])('preserves customized cells: %j', (customization) => {
    expect(canRemoveLayoutCell({ ...empty, ...customization })).toBe(false)
  })
})
