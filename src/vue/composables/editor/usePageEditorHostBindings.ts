import type { Ref } from 'vue'
import type { GlobalSettings, PageDocument } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { watch } from 'vue'

interface UsePageEditorHostBindingsOptions {
  editor: PageEditorInstance
  documentModel: Ref<PageDocument | undefined>
  pagesModel: Ref<PageDocument[] | undefined>
  activePageIdModel: Ref<string | undefined>
  globalsModel: Ref<GlobalSettings | null | undefined>
  onError: (errors: string[]) => void
}

function pageSignature(list: PageDocument[] | undefined, active: string | undefined | null): string {
  return `${(list ?? []).map(page => page.id).join(',')}|${active ?? ''}`
}

/**
 * Keeps PageEditor's host-facing models in sync with the editor instance.
 * The root component remains responsible for creating and providing the
 * editor; this composable owns the bidirectional model side effects.
 */
export function usePageEditorHostBindings(options: UsePageEditorHostBindingsOptions) {
  const {
    editor,
    documentModel,
    pagesModel,
    activePageIdModel,
    globalsModel,
    onError,
  } = options

  watch(documentModel, (value) => {
    if (value && value !== editor.document.value)
      editor.load(value)
  })

  watch(editor.document, (document) => {
    documentModel.value = document
  })

  // Reference equality skips the update that originated in the editor, while
  // a genuinely external globals object reseeds the shared context.
  watch(globalsModel, (value) => {
    if (value && value !== editor.globals.value)
      editor.setGlobals(value)
  })
  watch(editor.globals, (value) => {
    globalsModel.value = value
  })

  // Seed multi-page mode from the host model before subscribing to changes.
  if (pagesModel.value?.length)
    editor.setPages(pagesModel.value, activePageIdModel.value)

  // The signature guard prevents the editor's own model updates from looping
  // back through setPages while still accepting host-driven changes.
  watch(pagesModel, (value) => {
    if (!value?.length)
      return
    if (pageSignature(value, activePageIdModel.value) === pageSignature(editor.pagesView.value, editor.activePageId.value))
      return
    editor.setPages(value, activePageIdModel.value)
  })
  watch(activePageIdModel, (id) => {
    if (id && id !== editor.activePageId.value)
      editor.selectPage(id)
  })
  watch(editor.pages, () => {
    pagesModel.value = editor.pagesView.value
    activePageIdModel.value = editor.activePageId.value ?? undefined
  })
  watch(editor.activePageId, (id) => {
    activePageIdModel.value = id ?? undefined
  })

  // Make the Pages panel discoverable once the editor switches modes.
  let pagesPanelShown = false
  watch(() => editor.isMultiPage.value, (isMultiPage) => {
    if (isMultiPage && !pagesPanelShown) {
      pagesPanelShown = true
      editor.storage.value.sidebarMode = 'pages'
      editor.storage.value.sidebarPinned = true
    }
  }, { immediate: true })

  watch(editor.errors, (errors) => {
    if (errors.length)
      onError(errors)
  })
}
