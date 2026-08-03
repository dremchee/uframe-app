import type { BaseBlockStyles, BlockStyles } from '@/core/types/block-styles'
import type { PageDocument } from '@/core/types/page-document'
import { visitBlockTree } from '@/core/utils/block-tree'

const AUTOMATIC_CONTAINER_NAME = /^container-(\d+)$/

export function isAutomaticContainerName(name: string | undefined): boolean {
  return !!name && AUTOMATIC_CONTAINER_NAME.test(name)
}

/** Returns the next stable `container-N` name used nowhere in the document. */
export function nextContainerName(document: PageDocument): string {
  let highestIndex = 0

  function collectBaseStyles(styles: BaseBlockStyles | undefined) {
    const match = styles?.containerName?.match(AUTOMATIC_CONTAINER_NAME)
    if (match)
      highestIndex = Math.max(highestIndex, Number(match[1]))
  }

  function collectBlockStyles(styles: BlockStyles | undefined) {
    if (!styles)
      return

    collectBaseStyles(styles)
    Object.values(styles.states ?? {}).forEach(collectBaseStyles)
    Object.values(styles.responsive ?? {}).forEach(collectBaseStyles)
    Object.values(styles.containerResponsive ?? {}).forEach(variant =>
      collectBaseStyles(variant.style),
    )
  }

  collectBlockStyles(document.settings.style)
  Object.values(document.styles ?? {}).forEach(collectBlockStyles)

  const roots = [
    ...document.blocks,
    ...Object.values(document.symbols ?? {}).map(symbol => symbol.root),
  ]
  visitBlockTree(roots, block => collectBlockStyles(block.style))

  return `container-${highestIndex + 1}`
}
