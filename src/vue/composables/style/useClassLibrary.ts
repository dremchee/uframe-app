import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, ref } from 'vue'
import {
  classKeyApplies,
  isComboKey,
  parseClassKey,
  sanitizeClassName,
  visitBlockTree,
} from '@/core'

export type ClassUsageFilter = 'all' | 'used' | 'unused'

/**
 * Owns the class-library data and mutations used by ClassesPanel. The panel
 * stays presentational; this composable indexes document usage once and keeps
 * all class, combo, filter, and popover state together.
 */
export function useClassLibrary(editor: PageEditorInstance) {
  // Flat snapshot of every block's class-set, walked once per document change.
  // Usage counts and "locate" both read from this instead of re-walking the
  // tree for every class key (O(keys × blocks) → O(blocks)).
  const blockIndex = computed(() => {
    const out: { id: string, set: Set<string> }[] = []
    visitBlockTree(editor.document.value.blocks, (block) => {
      out.push({ id: block.id, set: new Set(block.classes ?? []) })
    })
    return out
  })

  function usageOf(key: string): number {
    let count = 0
    for (const { set } of blockIndex.value) {
      if (classKeyApplies(key, set))
        count += 1
    }
    return count
  }

  function firstBlockUsing(key: string): string | null {
    for (const { id, set } of blockIndex.value) {
      if (classKeyApplies(key, set))
        return id
    }
    return null
  }

  const singles = computed(() =>
    Object.keys(editor.effectiveDocument.value.styles ?? {})
      .filter(key => !isComboKey(key))
      .sort((a, b) => a.localeCompare(b)),
  )

  const combos = computed(() =>
    Object.keys(editor.effectiveDocument.value.styles ?? {})
      .filter(key => isComboKey(key))
      .map(key => ({ key, parts: parseClassKey(key) }))
      .sort((a, b) => a.parts.length - b.parts.length || a.key.localeCompare(b.key)),
  )

  const query = ref('')
  const usageFilter = ref<ClassUsageFilter>('used')

  function matchesFilters(key: string): boolean {
    const queryValue = query.value.trim().toLowerCase()
    if (queryValue && !parseClassKey(key).some(part => part.toLowerCase().includes(queryValue)))
      return false
    if (usageFilter.value !== 'all') {
      const used = usageOf(key) > 0
      return usageFilter.value === 'used' ? used : !used
    }
    return true
  }

  const visibleSingles = computed(() => singles.value.filter(name => matchesFilters(name)))
  const visibleCombos = computed(() => combos.value.filter(combo => matchesFilters(combo.key)))

  function editStyles(key: string) {
    const id = firstBlockUsing(key)
    if (id)
      editor.selectBlock(id)
    editor.requestEditClass(key)
  }

  const addOpen = ref(false)
  const addName = ref('')

  function submitAdd() {
    const name = sanitizeClassName(addName.value.trim())
    if (name && editor.ensureClass(name))
      addOpen.value = false
  }

  function renameClass(from: string, rawTo: string): boolean {
    const to = sanitizeClassName(rawTo.trim())
    return !!to && editor.renameClass(from, to)
  }

  function deleteClass(key: string) {
    editor.deleteClass(key)
  }

  const isEmpty = computed(() => !singles.value.length && !combos.value.length)
  const noMatches = computed(() =>
    !isEmpty.value && !visibleSingles.value.length && !visibleCombos.value.length,
  )

  return {
    query,
    usageFilter,
    usageOf,
    visibleSingles,
    visibleCombos,
    editStyles,
    addOpen,
    addName,
    submitAdd,
    renameClass,
    deleteClass,
    isEmpty,
    noMatches,
  }
}
