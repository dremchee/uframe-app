import { describe, expect, it } from 'vitest'
import { buildGroupTree, moveGroupPath, renameGroupPath, rewriteGroupPath } from './pages-tree'

describe('buildGroupTree', () => {
  it('creates missing ancestor nodes in first-appearance order', () => {
    expect(buildGroupTree(['Blog/Drafts', 'Pages', 'Blog/Published'])).toEqual([
      {
        path: 'Blog',
        name: 'Blog',
        children: [
          { path: 'Blog/Drafts', name: 'Drafts', children: [] },
          { path: 'Blog/Published', name: 'Published', children: [] },
        ],
      },
      { path: 'Pages', name: 'Pages', children: [] },
    ])
  })
})

describe('group paths', () => {
  it('rewrites a group subtree without touching sibling paths', () => {
    expect(rewriteGroupPath('Blog/Drafts/2026', 'Blog/Drafts', 'Articles')).toBe('Articles/2026')
    expect(rewriteGroupPath('Blog/Published', 'Blog/Drafts', 'Articles')).toBe('Blog/Published')
  })

  it('builds safe renamed and moved paths', () => {
    expect(renameGroupPath('Blog/Drafts', 'Archive')).toBe('Blog/Archive')
    expect(renameGroupPath('Blog', 'Nested/Name')).toBeNull()
    expect(moveGroupPath('Blog/Drafts', 'Archive')).toBe('Archive/Drafts')
    expect(moveGroupPath('Blog', 'Blog/Drafts')).toBeNull()
  })
})
