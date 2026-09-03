import type { PageBlock } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { flattenTree } from '@/core/utils/tree-flatten'

function tree(): PageBlock[] {
  return [
    {
      id: 'a',
      type: 'section',
      props: {},
      children: [
        { id: 'a1', type: 'heading', props: {} },
        {
          id: 'a2',
          type: 'container',
          props: {},
          children: [{ id: 'a2x', type: 'text', props: {} }],
        },
      ],
    },
    { id: 'b', type: 'heading', props: {} },
  ]
}

describe('flattenTree', () => {
  it('expands everything by default and tracks depth', () => {
    const items = flattenTree(tree())
    expect(items.map(i => i.block.id)).toEqual(['a', 'a1', 'a2', 'a2x', 'b'])
    expect(items.map(i => i.depth)).toEqual([0, 1, 1, 2, 0])
  })

  it('skips children of collapsed blocks', () => {
    const items = flattenTree(tree(), { isExpanded: id => id !== 'a' })
    expect(items.map(i => i.block.id)).toEqual(['a', 'b'])
  })

  it('skips only the targeted subtree, sibling expand still works', () => {
    const items = flattenTree(tree(), { isExpanded: id => id !== 'a2' })
    expect(items.map(i => i.block.id)).toEqual(['a', 'a1', 'a2', 'b'])
  })

  it('marks hasChildren and expanded correctly', () => {
    const items = flattenTree(tree())
    const a = items.find(i => i.block.id === 'a')!
    expect(a.hasChildren).toBe(true)
    expect(a.expanded).toBe(true)

    const heading = items.find(i => i.block.id === 'a1')!
    expect(heading.hasChildren).toBe(false)
    expect(heading.expanded).toBe(false)
  })
})
