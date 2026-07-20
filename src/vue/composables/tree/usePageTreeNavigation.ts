import type { Ref } from 'vue'
import type { NavRow, PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import type { LayerTreeRow, VirtualSlotLayerRow } from '@/vue/utils/layer-tree'
import { useVirtualList } from '@vueuse/core'
import { computed, nextTick, shallowRef, watch } from 'vue'
import { resolveTreeKey, treeRowDomId } from '@/core'
import { projectLayerTree } from '@/vue/utils/layer-tree'

export interface UsePageTreeNavigationOptions {
  editor: PageEditorInstance
  blocks: () => PageBlock[]
  collapsed: () => Set<string>
  selectedBlockId: () => string | null
  treeRootEl: Ref<HTMLElement | null>
  select: (id: string | null) => void
  toggle: (id: string) => void
}

/**
 * Maintains the virtualized Layers tree's active row, keyboard behaviour and
 * reveal-to-selection flow. It does not mutate blocks or handle drop targets.
 */
export function usePageTreeNavigation(options: UsePageTreeNavigationOptions) {
  const { editor, blocks, collapsed, selectedBlockId, treeRootEl, select, toggle } = options
  const rowHeight = 32

  function isExpanded(id: string) {
    return !collapsed().has(id)
  }

  const allRows = computed(() => projectLayerTree(blocks(), editor.effectiveDocument.value.symbols))
  const flatItems = computed(() => projectLayerTree(
    blocks(),
    editor.effectiveDocument.value.symbols,
    { isExpanded },
  ))
  const activeRowKey = shallowRef<string | null>(selectedBlockId())
  let preserveVirtualRowForNextSelection = false

  watch([selectedBlockId, () => editor.selectionIntentNonce.value], ([id, nonce], [, previousNonce]) => {
    if (nonce !== previousNonce && preserveVirtualRowForNextSelection) {
      preserveVirtualRowForNextSelection = false
      return
    }
    preserveVirtualRowForNextSelection = false
    activeRowKey.value = id
  })

  const isEditingSymbol = computed(() => !!editor.editingSymbolId.value)
  const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(flatItems, {
    itemHeight: rowHeight,
    overscan: 6,
  })

  function ensureIndexVisible(index: number) {
    const container = containerProps.ref.value
    const top = index * rowHeight
    if (container) {
      const { scrollTop, clientHeight } = container
      if (top >= scrollTop && top + rowHeight <= scrollTop + clientHeight)
        return
    }
    scrollTo(index)
  }

  function scrollToKey(key: string | null) {
    if (key == null) {
      const container = containerProps.ref.value
      if (container)
        container.scrollTop = 0
      return
    }
    const index = flatItems.value.findIndex(item => item.key === key)
    if (index >= 0)
      ensureIndexVisible(index)
  }

  function revealInTree(id: string) {
    const target = allRows.value.find(row => row.kind === 'block' && row.block.id === id)
    for (const ancestor of target?.ancestorKeys ?? []) {
      if (collapsed().has(ancestor))
        toggle(ancestor)
    }
    nextTick(() => {
      const index = flatItems.value.findIndex(item => item.kind === 'block' && item.block.id === id)
      if (index >= 0)
        ensureIndexVisible(index)
    })
  }

  watch(
    () => editor.revealInTreeRequest.value?.nonce,
    () => {
      const request = editor.revealInTreeRequest.value
      if (request)
        revealInTree(request.id)
    },
  )

  const hasFocus = shallowRef(false)
  const navRows = computed<NavRow[]>(() => {
    const blockRows = flatItems.value.map(item => ({
      id: item.key,
      depth: item.depth,
      hasChildren: item.hasChildren,
      expanded: item.expanded,
    }))
    if (isEditingSymbol.value)
      return blockRows
    return [{ id: null, depth: -1, hasChildren: blocks().length > 0, expanded: true }, ...blockRows]
  })
  const activeDescendant = computed(() =>
    hasFocus.value ? treeRowDomId(activeRowKey.value) : undefined,
  )

  function rowByKey(key: string | null): LayerTreeRow | undefined {
    return key == null ? undefined : allRows.value.find(row => row.key === key)
  }

  function selectLayerRow(key: string | null) {
    activeRowKey.value = key
    const row = rowByKey(key)
    preserveVirtualRowForNextSelection = row?.kind === 'slot'
    select(row?.kind === 'slot' ? row.instanceId : row?.block.id ?? null)
    scrollToKey(key)
  }

  function activateSlot(row: VirtualSlotLayerRow) {
    selectLayerRow(row.key)
    treeRootEl.value?.focus({ preventScroll: true })
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget)
      return
    const active = rowByKey(activeRowKey.value)
    if (active?.kind === 'slot' && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    const action = resolveTreeKey(navRows.value, activeRowKey.value, event)
    if (!action)
      return
    event.preventDefault()
    switch (action.type) {
      case 'select':
        selectLayerRow(action.id)
        break
      case 'toggle':
        toggle(action.id)
        break
      case 'duplicate':
        if (rowByKey(action.id)?.kind === 'block')
          editor.duplicateBlock(action.id)
        break
      case 'move':
        if (active?.kind === 'block') {
          editor.moveSelectedBlock(action.direction)
          nextTick(() => scrollToKey(activeRowKey.value))
        }
        break
    }
  }

  function onFocusIn() {
    if (!hasFocus.value)
      scrollToKey(activeRowKey.value)
    hasFocus.value = true
  }

  function onFocusOut(event: FocusEvent) {
    const root = treeRootEl.value
    if (root && event.relatedTarget instanceof Node && root.contains(event.relatedTarget))
      return
    hasFocus.value = false
  }

  function focusTree() {
    treeRootEl.value?.focus({ preventScroll: true })
  }

  return {
    activateSlot,
    activeDescendant,
    activeRowKey,
    containerProps,
    focusTree,
    isEditingSymbol,
    list,
    onFocusIn,
    onFocusOut,
    onKeydown,
    rowHeight,
    selectLayerRow,
    wrapperProps,
  }
}
