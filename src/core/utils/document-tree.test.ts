import type { PageBlock } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  findBlock,
  findBlockParentId,
  insertBlockInTree,
  isDescendantOf,
  moveBlock,
  moveBlockTo,
  removeBlockFromTree,
  updateBlockInTree,
  visitBlockTree,
} from '@/core/utils/block-tree'
import {
  createBlock,
  createBlockRegistry,
  createPageDocument,
} from '@/core/utils/document-tree'
import { validatePageDocument } from '@/core/utils/validation'

const headingDefinition = {
  type: 'heading',
  label: 'Heading',
  defaultProps: { content: 'Title' },
  propsSchema: z.object({ content: z.string() }),
  renderComponent: {},
}

const containerDefinition = {
  type: 'container',
  label: 'Container',
  defaultProps: {},
  propsSchema: z.object({}),
  renderComponent: {},
  acceptsChildren: true,
}

function makeTree(): PageBlock[] {
  return [
    {
      id: 'a',
      type: 'container',
      props: {},
      children: [
        { id: 'a1', type: 'heading', props: { content: 'A1' } },
        {
          id: 'a2',
          type: 'container',
          props: {},
          children: [{ id: 'a2x', type: 'heading', props: { content: 'A2X' } }],
        },
      ],
    },
    { id: 'b', type: 'heading', props: { content: 'B' } },
  ]
}

describe('createPageDocument', () => {
  it('builds a valid page with defaults', () => {
    const doc = createPageDocument({ title: 'Landing' })
    expect(doc.title).toBe('Landing')
    expect(doc.blocks).toEqual([])
    expect(doc.settings.width).toBe('responsive')
    expect(validatePageDocument(doc).success).toBe(true)
  })

  it('respects partial overrides', () => {
    const doc = createPageDocument({ id: 'x', version: 5 })
    expect(doc.id).toBe('x')
    expect(doc.version).toBe(5)
  })
})

describe('createBlock + createBlockRegistry', () => {
  it('merges defaultProps with overrides', () => {
    const block = createBlock(headingDefinition, { content: 'Hero' })
    expect(block.type).toBe('heading')
    expect(block.props).toEqual({ content: 'Hero' })
  })

  it('createBlockRegistry indexes by type', () => {
    const registry = createBlockRegistry([headingDefinition, containerDefinition])
    expect(registry.heading.label).toBe('Heading')
    expect(registry.container.acceptsChildren).toBe(true)
  })
})

describe('findBlock + findBlockParentId', () => {
  it('finds nested blocks by id', () => {
    const tree = makeTree()
    expect(findBlock(tree, 'a2x')?.props).toEqual({ content: 'A2X' })
    expect(findBlock(tree, 'missing')).toBeUndefined()
  })

  it('returns null parent for root blocks, undefined for unknown ids', () => {
    const tree = makeTree()
    expect(findBlockParentId(tree, 'a')).toBeNull()
    expect(findBlockParentId(tree, 'b')).toBeNull()
    expect(findBlockParentId(tree, 'a1')).toBe('a')
    expect(findBlockParentId(tree, 'a2x')).toBe('a2')
    expect(findBlockParentId(tree, 'missing')).toBeUndefined()
  })
})

describe('visitBlockTree', () => {
  it('walks depth-first and lets callers skip a subtree', () => {
    const visited: string[] = []
    visitBlockTree(makeTree(), (block) => {
      visited.push(block.id)
      return block.id === 'a2' ? false : undefined
    })
    expect(visited).toEqual(['a', 'a1', 'a2', 'b'])
  })
})

describe('isDescendantOf', () => {
  it('detects direct and transitive descendants', () => {
    const tree = makeTree()
    expect(isDescendantOf(tree, 'a', 'a1')).toBe(true)
    expect(isDescendantOf(tree, 'a', 'a2x')).toBe(true)
    expect(isDescendantOf(tree, 'a2', 'a2x')).toBe(true)
  })

  it('returns false for unrelated blocks and self-checks', () => {
    const tree = makeTree()
    expect(isDescendantOf(tree, 'b', 'a2x')).toBe(false)
    expect(isDescendantOf(tree, 'a', 'b')).toBe(false)
    expect(isDescendantOf(tree, 'a', 'a')).toBe(false)
  })
})

describe('updateBlockInTree', () => {
  it('updates immutably without mutating siblings', () => {
    const a = createBlock(headingDefinition, { content: 'A' })
    const b = createBlock(headingDefinition, { content: 'B' })
    const updated = updateBlockInTree([a, b], a.id, block => ({
      ...block,
      props: { content: 'Updated' },
    }))
    expect(updated[0]?.props).toEqual({ content: 'Updated' })
    expect(updated[1]).toBe(b)
    expect(a.props).toEqual({ content: 'A' })
  })

  it('updates a deeply nested block', () => {
    const tree = makeTree()
    const next = updateBlockInTree(tree, 'a2x', block => ({
      ...block,
      props: { content: 'Changed' },
    }))
    expect(findBlock(next, 'a2x')?.props).toEqual({ content: 'Changed' })
    expect(findBlock(tree, 'a2x')?.props).toEqual({ content: 'A2X' })
  })
})

describe('insertBlockInTree', () => {
  it('inserts at the root or into a nested parent without mutating the source', () => {
    const tree = makeTree()
    const rootBlock: PageBlock = { id: 'root', type: 'heading', props: {} }
    const childBlock: PageBlock = { id: 'child', type: 'heading', props: {} }

    expect(insertBlockInTree(tree, null, 1, rootBlock).map(block => block.id)).toEqual(['a', 'root', 'b'])
    expect(insertBlockInTree(tree, 'a2', 0, childBlock)[0]?.children?.[1]?.children?.map(block => block.id)).toEqual(['child', 'a2x'])
    expect(tree[0]?.children?.[1]?.children?.map(block => block.id)).toEqual(['a2x'])
  })

  it('returns the original tree when the requested parent does not exist', () => {
    const tree = makeTree()
    expect(insertBlockInTree(tree, 'missing', 0, { id: 'new', type: 'heading', props: {} })).toBe(tree)
  })
})

describe('moveBlock (sibling shift)', () => {
  it('moves a root block within its siblings', () => {
    const tree: PageBlock[] = [
      { id: 'x', type: 'heading', props: {} },
      { id: 'y', type: 'heading', props: {} },
      { id: 'z', type: 'heading', props: {} },
    ]
    expect(moveBlock(tree, 'x', 1).map(b => b.id)).toEqual(['y', 'x', 'z'])
    expect(moveBlock(tree, 'z', -1).map(b => b.id)).toEqual(['x', 'z', 'y'])
  })

  it('returns the same array if the target moves past the edge', () => {
    const tree: PageBlock[] = [{ id: 'only', type: 'heading', props: {} }]
    expect(moveBlock(tree, 'only', -1)).toBe(tree)
    expect(moveBlock(tree, 'only', 1)).toBe(tree)
  })

  it('moves a nested block recursively', () => {
    const tree = makeTree()
    const moved = moveBlock(tree, 'a1', 1)
    const a = findBlock(moved, 'a')
    expect(a?.children?.map(c => c.id)).toEqual(['a2', 'a1'])
  })
})

describe('moveBlockTo (cross-parent)', () => {
  it('reorders siblings in the same parent', () => {
    const tree: PageBlock[] = [
      { id: 'x', type: 'heading', props: {} },
      { id: 'y', type: 'heading', props: {} },
      { id: 'z', type: 'heading', props: {} },
    ]
    const next = moveBlockTo(tree, 'z', null, 0)
    expect(next.map(b => b.id)).toEqual(['z', 'x', 'y'])
  })

  it('appends into a container that accepts children', () => {
    const tree = makeTree()
    const next = moveBlockTo(tree, 'b', 'a2', Number.MAX_SAFE_INTEGER)
    expect(findBlock(next, 'a2')?.children?.map(c => c.id)).toEqual(['a2x', 'b'])
    expect(next.map(b => b.id)).toEqual(['a']) // b removed from root
  })

  it('moves across parents at a specific index', () => {
    const tree = makeTree()
    const next = moveBlockTo(tree, 'a1', null, 0)
    expect(next.map(b => b.id)).toEqual(['a1', 'a', 'b'])
    expect(findBlock(next, 'a')?.children?.map(c => c.id)).toEqual(['a2'])
  })

  it('refuses to move a block into its own descendant', () => {
    const tree = makeTree()
    expect(moveBlockTo(tree, 'a', 'a2', 0)).toBe(tree)
  })

  it('refuses to move a block onto itself', () => {
    const tree = makeTree()
    expect(moveBlockTo(tree, 'a', 'a', 0)).toBe(tree)
  })

  it('returns the same tree if the source id is unknown', () => {
    const tree = makeTree()
    expect(moveBlockTo(tree, 'missing', null, 0)).toBe(tree)
  })
})

describe('removeBlockFromTree', () => {
  it('removes a root block', () => {
    const tree = makeTree()
    const next = removeBlockFromTree(tree, 'b')
    expect(next.map(b => b.id)).toEqual(['a'])
  })

  it('removes a nested block and leaves siblings/parents intact', () => {
    const tree = makeTree()
    const next = removeBlockFromTree(tree, 'a2x')
    expect(findBlock(next, 'a2x')).toBeUndefined()
    expect(findBlock(next, 'a2')?.children).toEqual([])
    expect(findBlock(next, 'a1')).toBeDefined()
  })
})
