import type { NavRow } from '@/core/utils/tree-nav'
import { describe, expect, it } from 'vitest'
import {
  firstChildRowId,
  lastRowId,
  nextRowId,
  parentRowId,
  prevRowId,
  resolveTreeKey,
  treeRowDomId,
} from '@/core/utils/tree-nav'

// body(-1) → a(0) → [a1(1), a2(1) → a2x(2)], b(0). a2 collapsed in some cases.
function rows(opts: { a2Expanded?: boolean } = {}): NavRow[] {
  const a2Expanded = opts.a2Expanded ?? true
  const base: NavRow[] = [
    { id: null, depth: -1, hasChildren: true, expanded: true },
    { id: 'a', depth: 0, hasChildren: true, expanded: true },
    { id: 'a1', depth: 1, hasChildren: false, expanded: false },
    { id: 'a2', depth: 1, hasChildren: true, expanded: a2Expanded },
  ]
  if (a2Expanded)
    base.push({ id: 'a2x', depth: 2, hasChildren: false, expanded: false })
  base.push({ id: 'b', depth: 0, hasChildren: false, expanded: false })
  return base
}

describe('tree-nav primitives', () => {
  it('next/prev walk the flat list', () => {
    expect(nextRowId(rows(), 'a')).toBe('a1')
    expect(prevRowId(rows(), 'a1')).toBe('a')
    expect(nextRowId(rows(), null)).toBe('a') // body → first block
    expect(prevRowId(rows(), 'a')).toBe(null) // first block → body
  })

  it('returns undefined at the ends', () => {
    expect(prevRowId(rows(), null)).toBeUndefined()
    expect(nextRowId(rows(), 'b')).toBeUndefined()
    expect(lastRowId(rows())).toBe('b')
  })

  it('parent walks back to a shallower depth (body is the root parent)', () => {
    expect(parentRowId(rows(), 'a2x')).toBe('a2')
    expect(parentRowId(rows(), 'a1')).toBe('a')
    expect(parentRowId(rows(), 'a')).toBe(null) // top-level block → body
    expect(parentRowId(rows(), null)).toBeUndefined() // body has no parent
  })

  it('first child only when expanded with children', () => {
    expect(firstChildRowId(rows(), 'a')).toBe('a1')
    expect(firstChildRowId(rows(), 'a1')).toBeUndefined() // leaf
    expect(firstChildRowId(rows({ a2Expanded: false }), 'a2')).toBeUndefined()
    expect(firstChildRowId(rows(), null)).toBe('a') // body → first block
  })
})

describe('treeRowDomId', () => {
  it('namespaces block ids and the body sentinel', () => {
    expect(treeRowDomId('abc')).toBe('uf-tree-abc')
    expect(treeRowDomId(null)).toBe('uf-tree-__body__')
  })
})

describe('resolveTreeKey', () => {
  it('arrows select the next/previous row', () => {
    expect(resolveTreeKey(rows(), 'a', { key: 'ArrowDown' })).toEqual({ type: 'select', id: 'a1' })
    expect(resolveTreeKey(rows(), 'a1', { key: 'ArrowUp' })).toEqual({ type: 'select', id: 'a' })
  })

  it('expands a collapsed parent on ArrowRight, then descends', () => {
    const collapsed = rows({ a2Expanded: false })
    expect(resolveTreeKey(collapsed, 'a2', { key: 'ArrowRight' })).toEqual({ type: 'toggle', id: 'a2' })
    expect(resolveTreeKey(rows(), 'a2', { key: 'ArrowRight' })).toEqual({ type: 'select', id: 'a2x' })
  })

  it('collapses an expanded parent on ArrowLeft, else moves to parent', () => {
    expect(resolveTreeKey(rows(), 'a', { key: 'ArrowLeft' })).toEqual({ type: 'toggle', id: 'a' })
    expect(resolveTreeKey(rows(), 'a1', { key: 'ArrowLeft' })).toEqual({ type: 'select', id: 'a' })
  })

  it('jumps to the ends with Home/End', () => {
    expect(resolveTreeKey(rows(), 'a2', { key: 'Home' })).toEqual({ type: 'select', id: null })
    expect(resolveTreeKey(rows(), 'a', { key: 'End' })).toEqual({ type: 'select', id: 'b' })
  })

  it('reorders with Alt+Arrow, but never on the body', () => {
    expect(resolveTreeKey(rows(), 'a', { key: 'ArrowDown', altKey: true })).toEqual({ type: 'move', direction: 1 })
    expect(resolveTreeKey(rows(), 'a', { key: 'ArrowUp', altKey: true })).toEqual({ type: 'move', direction: -1 })
    expect(resolveTreeKey(rows(), null, { key: 'ArrowDown', altKey: true })).toBeNull()
  })

  it('duplicates blocks with Cmd/Ctrl+D, but not the body', () => {
    expect(resolveTreeKey(rows(), 'b', { key: 'd', metaKey: true })).toEqual({ type: 'duplicate', id: 'b' })
    expect(resolveTreeKey(rows(), 'b', { key: 'd', ctrlKey: true })).toEqual({ type: 'duplicate', id: 'b' })
    expect(resolveTreeKey(rows(), 'b', { key: 'd' })).toBeNull() // no modifier
    expect(resolveTreeKey(rows(), null, { key: 'd', metaKey: true })).toBeNull()
  })

  it('leaves deletion to the global hotkey', () => {
    expect(resolveTreeKey(rows(), 'b', { key: 'Delete' })).toBeNull()
    expect(resolveTreeKey(rows(), 'b', { key: 'Backspace' })).toBeNull()
  })

  it('returns null for unhandled keys and dead-end moves', () => {
    expect(resolveTreeKey(rows(), 'a', { key: 'x' })).toBeNull()
    expect(resolveTreeKey(rows(), null, { key: 'ArrowUp' })).toBeNull() // body is first
    expect(resolveTreeKey(rows(), 'b', { key: 'ArrowDown' })).toBeNull() // last row
  })
})
