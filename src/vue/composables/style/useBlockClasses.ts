import type { ComputedRef, Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { classKeyApplies, isComboKey, normalizeComboKey, parseClassKey, sanitizeClassName, visitBlockTree } from '@/core'

export type EditingTarget
  = | { kind: 'block' }
    | { kind: 'page' }
    | { kind: 'class', name: string }

export interface UseBlockClassesOptions {
  editor: PageEditorInstance
  block: ComputedRef<PageBlock | undefined>
  editingTarget: Ref<EditingTarget>
  newClassName: Ref<string>
}

/**
 * Owns the block's class-list + combo bookkeeping for the properties panel:
 *
 * - Available / applied / applicable-combo / creatable-combo computeds.
 * - The combo-creation popover state (`comboMenuOpen` + `comboMenuRef`).
 * - The `editingClass` derivation from `editingTarget` and the usage-count
 *   roll-up that drives the "N elements" hint next to the chip.
 * - The mutation actions (`applyClassNamed`, `removeClass`, `focusClass`).
 * - Every entry point runs the core `sanitizeClassName` (names are emitted
 *   into markup verbatim, so the rule lives next to `styleClassName`).
 *
 * `editingTarget` is passed in (not owned) because it's also written by the
 * symbol-instance flow when the selection changes.
 */
export function useBlockClasses(opts: UseBlockClassesOptions) {
  const { editor, block, editingTarget, newClassName } = opts

  const availableClasses = computed(() =>
    Object.keys(editor.effectiveDocument.value.styles ?? {}).filter(name => !isComboKey(name)),
  )
  const blockClasses = computed(() => block.value?.classes ?? [])

  // Base classes the block doesn't already have — the autocomplete suggestion
  // pool for the "Add class name" field (suggesting an applied class is a no-op).
  const unappliedClasses = computed(() => {
    const applied = new Set(blockClasses.value)
    return availableClasses.value.filter(name => !applied.has(name))
  })

  // Existing combos in document.styles whose parts are a subset of the
  // block's applied classes — only these can ever affect the current block.
  const applicableCombos = computed(() => {
    const blockSet = new Set(blockClasses.value)
    if (blockSet.size < 2)
      return []
    const styles = editor.effectiveDocument.value.styles ?? {}
    const out: { key: string, parts: string[] }[] = []
    for (const key of Object.keys(styles)) {
      if (!isComboKey(key))
        continue
      const parts = parseClassKey(key)
      if (parts.length < 2)
        continue
      if (classKeyApplies(key, blockSet))
        out.push({ key, parts })
    }
    return out.sort((a, b) => a.parts.length - b.parts.length || a.key.localeCompare(b.key))
  })

  function subsetsOfSizeAtLeastTwo(items: string[]): string[][] {
    const result: string[][] = []
    const n = items.length
    for (let mask = 0; mask < 1 << n; mask++) {
      const pick: string[] = []
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i))
          pick.push(items[i]!)
      }
      if (pick.length >= 2)
        result.push(pick)
    }
    return result
  }

  // Combinations the user could create from the block's currently-applied
  // classes that don't yet exist in document.styles.
  const creatableCombos = computed(() => {
    const classes = blockClasses.value
    if (classes.length < 2)
      return []
    const styles = editor.effectiveDocument.value.styles ?? {}
    return subsetsOfSizeAtLeastTwo(classes)
      .map(parts => ({ key: normalizeComboKey(parts), parts }))
      .filter(c => !styles[c.key])
      .sort((a, b) => a.parts.length - b.parts.length || a.key.localeCompare(b.key))
  })

  const comboMenuOpen = ref(false)
  const comboMenuRef = useTemplateRef<HTMLElement>('comboMenuRef')
  onClickOutside(comboMenuRef, () => {
    comboMenuOpen.value = false
  })
  function toggleComboMenu() {
    comboMenuOpen.value = !comboMenuOpen.value
  }

  function createComboFromParts(parts: string[]) {
    const key = editor.createCombo(parts)
    comboMenuOpen.value = false
    if (key)
      editingTarget.value = { kind: 'class', name: key }
  }

  const editingClass = computed(() =>
    editingTarget.value.kind === 'class' ? editingTarget.value.name : null,
  )
  const editingClassUsageCount = computed(() => {
    if (!editingClass.value)
      return 0
    let count = 0
    visitBlockTree(editor.document.value.blocks, (block) => {
      if (block.classes?.includes(editingClass.value!))
        count += 1
    })
    return count
  })

  function focusClass(name: string) {
    editingTarget.value = { kind: 'class', name }
  }

  // The single "add class" action (Enter or the in-field + trigger). An
  // existing name is simply applied; a NEW name on a locally-styled block is
  // created FROM those styles (createClassFromBlock moves them into the class)
  // so the emitted markup carries exactly the name the user typed — otherwise
  // an empty class is created and applied.
  function applyClassNamed(raw: string) {
    if (!block.value)
      return
    const name = sanitizeClassName(raw.trim())
    if (!name)
      return
    const exists = !!(editor.effectiveDocument.value.styles ?? {})[name]
    const hasLocalStyle = !!block.value.style && Object.keys(block.value.style).length > 0
    if (!exists && hasLocalStyle)
      editor.createClass(block.value.id, name)
    else
      editor.applyClass(block.value.id, name)
    newClassName.value = ''
    editingTarget.value = { kind: 'class', name }
  }

  function removeClass(name: string) {
    if (!block.value)
      return
    editor.removeClass(block.value.id, name)
    // If the removed class was being edited directly, or was part of the
    // currently active combo (which now no longer applies to the block),
    // retarget to the block's first remaining class — same rule as selection —
    // so the next edit still lands in a class; only a now-class-less block
    // falls back to the block target.
    if (editingTarget.value.kind === 'class') {
      const editingParts = parseClassKey(editingTarget.value.name)
      if (editingParts.includes(name)) {
        const remaining = block.value.classes ?? []
        editingTarget.value = remaining.length
          ? { kind: 'class', name: remaining[0]! }
          : { kind: 'block' }
      }
    }
  }

  return {
    availableClasses,
    unappliedClasses,
    blockClasses,
    applicableCombos,
    creatableCombos,
    comboMenuOpen,
    comboMenuRef,
    toggleComboMenu,
    createComboFromParts,
    editingClass,
    editingClassUsageCount,
    sanitizeClassName,
    focusClass,
    applyClassNamed,
    removeClass,
  }
}
