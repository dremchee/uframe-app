import type { ComputedRef, InjectionKey, Ref, WritableComputedRef } from 'vue'
import type { BaseBlockStyles, PageBlock } from '@/core'
import type { StateKey, ViewportKey } from '@/vue/components/style-panel/StyleVariantSelector.vue'
import type { EditingTarget } from '@/vue/composables/style/useBlockClasses'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, inject, provide, ref, watch } from 'vue'
import { useBlockStyleModel } from '@/vue/composables/style/useBlockStyleModel'

/**
 * The style-editing target for the current selection: which layer receives
 * edits (the block itself, the page, or one of the block's classes), the
 * breakpoint and state being edited, and `blockSlice` — the flat style subset
 * the controls bind to. Created once per editor and shared, so the properties
 * panel and the canvas quick panel are two views of one model and can never
 * disagree about where an edit lands.
 */
export interface StyleTarget {
  block: ComputedRef<PageBlock | undefined>
  editingTarget: Ref<EditingTarget>
  viewport: WritableComputedRef<ViewportKey>
  styleState: Ref<StateKey>
  blockSlice: WritableComputedRef<BaseBlockStyles>
}

export const STYLE_TARGET_KEY: InjectionKey<StyleTarget> = Symbol('uf-style-target')

export function createStyleTarget(editor: PageEditorInstance): StyleTarget {
  const block = computed(() => editor.selectedBlock.value)

  // The edited breakpoint is the toolbar viewport — single source of truth, so
  // the panel tabs and the toolbar stay in sync both ways.
  const viewport = computed<ViewportKey>({
    get: () => editor.editBreakpoint.value,
    set: value => editor.setEditBreakpoint(value),
  })
  const styleState = ref<StateKey>('default')
  const editingTarget = ref<EditingTarget>({ kind: 'block' })

  // Switch editing target whenever the selected block changes. A block that
  // already carries classes opens on its FIRST class: style edits land in the
  // class instead of silently piling up in the element's unnamed local layer
  // (the uf-block-<id> rule). A class-less block lands on the `block` target
  // with the full editor visible — its first style edit auto-creates a class
  // (see useBlockStyleModel), so styles still only ever live in classes.
  watch(
    () => block.value?.id,
    () => {
      if (!block.value) {
        editingTarget.value = { kind: 'page' }
        return
      }
      const classes = block.value.classes ?? []
      editingTarget.value = classes.length
        ? { kind: 'class', name: classes[0]! }
        : { kind: 'block' }
    },
    // `immediate` covers an editor created with a block already selected
    // (restored editor state): without it the target would sit on the initial
    // `block` kind and the first edit would mint a spurious class.
    { immediate: true },
  )

  // The class manager (left sidebar) requests opening a class for style editing.
  // Registered after the block-selection reset above so that, when a single click
  // both selects an element and asks to edit its class, focusing the class wins.
  watch(
    () => editor.editClassRequest.value?.nonce,
    () => {
      const request = editor.editClassRequest.value
      if (request)
        editingTarget.value = { kind: 'class', name: request.name }
    },
  )

  const { blockSlice } = useBlockStyleModel({ editor, block, editingTarget, viewport, styleState })

  return { block, editingTarget, viewport, styleState, blockSlice }
}

/** Creates the shared target and provides it to the editor's component tree. */
export function provideStyleTarget(editor: PageEditorInstance): StyleTarget {
  const target = createStyleTarget(editor)
  provide(STYLE_TARGET_KEY, target)
  return target
}

export function useStyleTarget(): StyleTarget {
  const target = inject(STYLE_TARGET_KEY, null)
  if (!target)
    throw new Error('useStyleTarget must be used within a PageEditor')
  return target
}
