/** Returns the first descendant that generates a CSS box through display:contents wrappers. */
export function renderedBoxElement(element: Element | null, win: Window | null): Element | null {
  let current = element
  while (current && win?.getComputedStyle(current).display === 'contents')
    current = current.firstElementChild
  return current
}

/** Finds a canvas block by id and resolves its real rendered box element. */
export function findRenderedBlockElement(doc: Document | null, win: Window | null, id: string | null): Element | null {
  if (!doc || !win || !id)
    return null
  const wrapper = doc.querySelector(`[data-block-id="${CSS.escape(id)}"]`)
  return renderedBoxElement(wrapper, win)
}

/** Returns the canvas-only wrapper for a block without resolving display:contents. */
export function findCanvasBlockWrapper(doc: Document | null, id: string | null): HTMLElement | null {
  if (!doc || !id)
    return null
  return doc.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(id)}"]`)
}
