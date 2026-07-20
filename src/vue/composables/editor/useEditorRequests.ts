import { shallowRef } from 'vue'

export type EditorRequest<T extends object> = T & {
  nonce: number
}

function useEditorRequest<T extends object>() {
  const request = shallowRef<EditorRequest<T> | null>(null)
  let nonce = 0

  function dispatch(value: T | null | undefined) {
    if (!value)
      return
    nonce += 1
    request.value = { ...value, nonce }
  }

  return { request, dispatch }
}

/** One-shot intents shared between editor surfaces; nonce preserves repeats. */
export function useEditorRequests() {
  const editClass = useEditorRequest<{ name: string }>()
  const revealBlock = useEditorRequest<{ id: string }>()
  const revealInTree = useEditorRequest<{ id: string }>()

  return {
    editClassRequest: editClass.request,
    requestEditClass: (name: string) => name && editClass.dispatch({ name }),
    revealBlockRequest: revealBlock.request,
    requestRevealBlock: (id: string | null) => id && revealBlock.dispatch({ id }),
    revealInTreeRequest: revealInTree.request,
    requestRevealInTree: (id: string | null) => id && revealInTree.dispatch({ id }),
  }
}
