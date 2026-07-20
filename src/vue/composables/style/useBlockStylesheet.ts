import type { MaybeRefOrGetter } from 'vue'
import type { BlockRegistry, PageDocument } from '@/core'
import { onBeforeUnmount, toValue, watch } from 'vue'
import { collectBlockCss, serializeDocumentStyles } from '@/core'

export function useBlockStylesheet(
  document: MaybeRefOrGetter<PageDocument>,
  target: MaybeRefOrGetter<Document | null | undefined>,
  registry?: MaybeRefOrGetter<BlockRegistry | undefined>,
) {
  let sheet: CSSStyleSheet | null = null
  let attachedDoc: Document | null = null

  function detach() {
    if (!sheet || !attachedDoc)
      return

    attachedDoc.adoptedStyleSheets = attachedDoc.adoptedStyleSheets.filter(s => s !== sheet)
    sheet = null
    attachedDoc = null
  }

  function attach(doc: Document) {
    const win = doc.defaultView
    if (!win || typeof win.CSSStyleSheet !== 'function')
      return

    sheet = new win.CSSStyleSheet()
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet]
    attachedDoc = doc
  }

  // `document` is a shallowRef reassigned on every commit, so watching the
  // value by reference fires for each edit without a `deep` traversal. Keying
  // on `document.updatedAt` instead would drop renders: that timestamp is only
  // millisecond-precise, so multiple commits in the same millisecond collapse
  // to one value and the stylesheet stops tracking the final state.
  watch(
    () => [toValue(document), toValue(target), toValue(registry)] as const,
    ([doc, targetDoc, reg]) => {
      if (!targetDoc) {
        detach()
        return
      }

      if (attachedDoc !== targetDoc) {
        detach()
        attach(targetDoc)
      }

      // Block-type CSS before document styles so per-block / class rules win.
      const blockCss = reg ? collectBlockCss(doc.blocks, reg, doc.symbols) : ''
      sheet?.replaceSync([blockCss, serializeDocumentStyles(doc)].filter(Boolean).join('\n'))
    },
    { immediate: true },
  )

  onBeforeUnmount(detach)
}
