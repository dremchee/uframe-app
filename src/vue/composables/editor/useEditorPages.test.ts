import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { createPageDocument } from '@/core'
import { useEditorPages } from './useEditorPages'

function createPages() {
  const first = createPageDocument({ id: 'first', title: 'First', group: 'Docs' })
  const second = createPageDocument({ id: 'second', title: 'Second', group: 'Docs/Drafts' })
  const document = shallowRef(first)
  const commits: string[] = []
  let pageChanges = 0
  const pages = useEditorPages({
    document,
    beforePageChange: () => { pageChanges += 1 },
    load: (page) => { document.value = page },
    commit: (page, label) => {
      commits.push(label)
      document.value = page
    },
  })
  pages.setPages([first, second], first.id)
  return {
    document,
    first,
    second,
    pages,
    commits,
    get pageChanges() {
      return pageChanges
    },
  }
}

describe('useEditorPages', () => {
  it('preserves live edits while switching active pages', () => {
    const state = createPages()
    state.document.value = { ...state.document.value, title: 'Edited first' }

    expect(state.pages.selectPage(state.second.id)).toBe(true)
    expect(state.document.value.id).toBe(state.second.id)
    expect(state.pages.pagesView.value.find(page => page.id === state.first.id)?.title).toBe('Edited first')
    expect(state.pageChanges).toBe(2)
  })

  it('rewrites nested group paths and reorders pages into a destination group', () => {
    const state = createPages()

    expect(state.pages.renameGroup('Docs', 'Guides')).toBe(true)
    expect(state.pages.pagesView.value.map(page => page.group)).toEqual(['Guides', 'Guides/Drafts'])
    expect(state.pages.movePage(state.second.id, 'Archive', state.first.id)).toBe(true)
    expect(state.pages.pagesView.value.map(page => [page.id, page.group])).toEqual([
      ['second', 'Archive'],
      ['first', 'Guides'],
    ])
  })
})
