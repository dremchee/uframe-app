import type { ShallowRef } from 'vue'
import type { PageDocument } from '@/core'
import { computed, shallowRef } from 'vue'
import { createPageDocument, insertListItem } from '@/core'
import { moveGroupPath, renameGroupPath, rewriteGroupPath as rewritePageGroupPath } from '@/vue/composables/pages/pages-tree'
import { useUframeI18n } from '@/vue/i18n'

export interface UseEditorPagesOptions {
  document: ShallowRef<PageDocument>
  /** Finalizes a component-master edit before changing the active page. */
  beforePageChange: () => void
  /** Replaces the editor's live document with the selected page. */
  load: (document: PageDocument) => void
  /** Records an active-page rename in the editor history. */
  commit: (document: PageDocument, label: string) => void
}

/**
 * Owns the multi-page set and its flat group paths. The active page is the
 * editor's live document, so this composable only coordinates switching and
 * folds unsaved active-page edits back into the stored page list.
 */
export function useEditorPages(options: UseEditorPagesOptions) {
  const { document, beforePageChange, load, commit } = options
  const { t } = useUframeI18n()
  const pages = shallowRef<PageDocument[]>([])
  const activePageId = shallowRef<string | null>(null)
  const isMultiPage = computed(() => pages.value.length > 0)
  const pagesView = computed<PageDocument[]>(() =>
    pages.value.map(page => (page.id === activePageId.value ? document.value : page)),
  )

  function syncActiveIntoPages(): PageDocument[] {
    return pages.value.map(page => (page.id === activePageId.value ? document.value : page))
  }

  function setPages(list: PageDocument[], active?: string | null) {
    beforePageChange()
    pages.value = list.slice()
    activePageId.value = active ?? list[0]?.id ?? null
    const target = list.find(page => page.id === activePageId.value) ?? list[0]
    if (target)
      load(target)
  }

  function selectPage(id: string): boolean {
    if (id === activePageId.value)
      return false
    beforePageChange()
    const synced = syncActiveIntoPages()
    const target = synced.find(page => page.id === id)
    if (!target)
      return false
    pages.value = synced
    activePageId.value = id
    load(target)
    return true
  }

  function addPage(title = t('pages.untitled'), group?: string): string {
    beforePageChange()
    const page = createPageDocument({ title, group: group?.trim() || undefined })
    pages.value = [...syncActiveIntoPages(), page]
    activePageId.value = page.id
    load(page)
    return page.id
  }

  function removePage(id: string): boolean {
    beforePageChange()
    if (pages.value.length <= 1)
      return false
    const synced = syncActiveIntoPages()
    const index = synced.findIndex(page => page.id === id)
    if (index === -1)
      return false
    const next = synced.filter(page => page.id !== id)
    pages.value = next
    if (activePageId.value === id) {
      const target = next[index] ?? next[index - 1] ?? next[0]!
      activePageId.value = target.id
      load(target)
    }
    return true
  }

  function renamePage(id: string, title: string): boolean {
    const clean = title.trim()
    if (!clean)
      return false
    if (id === activePageId.value)
      commit({ ...document.value, title: clean }, 'history.renamePage')
    else
      pages.value = pages.value.map(page => (page.id === id ? { ...page, title: clean } : page))
    return true
  }

  const pageGroups = computed<string[]>(() => {
    const seen = new Set<string>()
    const groups: string[] = []
    for (const page of pagesView.value) {
      if (page.group && !seen.has(page.group)) {
        seen.add(page.group)
        groups.push(page.group)
      }
    }
    return groups
  })

  function setPageGroup(id: string, group: string | undefined): boolean {
    const clean = group?.trim() || undefined
    if (id === activePageId.value) {
      if ((document.value.group || undefined) === clean)
        return false
      document.value = { ...document.value, group: clean }
    }
    else {
      pages.value = pages.value.map(page => (page.id === id ? { ...page, group: clean } : page))
    }
    return true
  }

  function rewriteGroupPath(fromPath: string, toPath: string): boolean {
    if (!fromPath || !toPath || fromPath === toPath)
      return false
    pages.value = syncActiveIntoPages().map(page => ({
      ...page,
      group: rewritePageGroupPath(page.group, fromPath, toPath),
    }))
    const nextActive = rewritePageGroupPath(document.value.group, fromPath, toPath)
    if (nextActive !== document.value.group)
      document.value = { ...document.value, group: nextActive }
    return true
  }

  function renameGroup(fromPath: string, newName: string): boolean {
    const toPath = renameGroupPath(fromPath, newName)
    return toPath ? rewriteGroupPath(fromPath, toPath) : false
  }

  function moveGroup(fromPath: string, toParent: string | null): boolean {
    const toPath = moveGroupPath(fromPath, toParent)
    return toPath ? rewriteGroupPath(fromPath, toPath) : false
  }

  function movePage(id: string, group: string | undefined, beforeId: string | null = null): boolean {
    const clean = group?.trim() || undefined
    const synced = syncActiveIntoPages()
    const moving = synced.find(page => page.id === id)
    if (!moving)
      return false
    const updated = { ...moving, group: clean }
    const rest = synced.filter(page => page.id !== id)
    const beforeIndex = beforeId ? rest.findIndex(page => page.id === beforeId) : -1
    pages.value = insertListItem(rest, beforeIndex === -1 ? rest.length : beforeIndex, updated)
    if (id === activePageId.value && (document.value.group || undefined) !== clean)
      document.value = { ...document.value, group: clean }
    return true
  }

  return {
    pages,
    activePageId,
    isMultiPage,
    pagesView,
    pageGroups,
    setPages,
    selectPage,
    addPage,
    removePage,
    renamePage,
    setPageGroup,
    renameGroup,
    moveGroup,
    movePage,
  }
}
