/**
 * Replaces the browser's implicit drag image with an exact card-sized clone.
 * Native previews otherwise include the source card's outer shadow, which
 * reads as a background extending beyond the item while it follows the cursor.
 */
export function setLibraryCardDragPreview(element: HTMLElement, event: DragEvent): void {
  const dataTransfer = event.dataTransfer
  if (!dataTransfer)
    return

  const rect = element.getBoundingClientRect()
  const preview = element.cloneNode(true) as HTMLElement
  preview.setAttribute('aria-hidden', 'true')
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-10000px',
    left: '-10000px',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    boxSizing: 'border-box',
    boxShadow: 'none',
    pointerEvents: 'none',
  })

  element.ownerDocument.body.append(preview)
  dataTransfer.setDragImage(
    preview,
    Math.max(0, event.clientX - rect.left),
    Math.max(0, event.clientY - rect.top),
  )
  requestAnimationFrame(() => preview.remove())
}
