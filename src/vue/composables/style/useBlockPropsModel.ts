import type { Ref } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useDebounceFn } from '@vueuse/core'
import { onScopeDispose, ref, watch } from 'vue'
import { cloneJsonValue } from '@/core'

/**
 * Editable mirror of the selected block's `props`. Loads a deep copy on
 * selection change (without echoing back) and debounce-commits edits through
 * `editor.replaceBlockProps`. Extracted from PropertiesPanel so the panel only
 * wires it to the Content form.
 */
export function useBlockPropsModel(editor: PageEditorInstance, block: Ref<PageBlock | undefined>) {
  const localProps = ref<Record<string, unknown>>({})
  // Set while loading a fresh block so the deep watch below doesn't treat the
  // load as a user edit and echo it straight back as a commit.
  let skipEmit = false
  // The pending edit, captured against the block it was made on — NOT read from
  // `block.value` at flush time. Otherwise a fast block switch (before the debounce
  // fires) would commit the previous block's edit to the newly-selected block.
  let pending: { id: string, props: Record<string, unknown> } | null = null

  function load(value: PageBlock | undefined) {
    skipEmit = true
    localProps.value = value
      ? cloneJsonValue(value.props)
      : {}
  }

  function flush() {
    if (!pending)
      return
    editor.replaceBlockProps(pending.id, pending.props)
    pending = null
  }
  const commit = useDebounceFn(flush, 120)

  // Switching blocks must persist the previous block's pending edit before the
  // new props load — flush synchronously, then load.
  watch(() => block.value?.id, () => {
    flush()
    load(block.value)
  }, { immediate: true })

  watch(
    localProps,
    () => {
      if (skipEmit) {
        skipEmit = false
        return
      }
      const current = block.value
      if (!current)
        return
      // Snapshot the edit against its block so the trailing commit can't be
      // retargeted by a later selection change.
      pending = { id: current.id, props: cloneJsonValue(localProps.value) }
      commit()
    },
    { deep: true },
  )

  // Persist any in-flight edit if the panel unmounts before the debounce fires.
  onScopeDispose(flush)

  return { localProps }
}
