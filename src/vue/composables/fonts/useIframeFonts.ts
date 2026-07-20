import type { Ref } from 'vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { watch } from 'vue'
import { fontStylesheetLinks } from '@/core'

const MARK = 'data-uf-font'

/**
 * Keep the font stylesheet `<link>`s in an editor iframe's <head> in sync with
 * the registered fonts, so canvas/preview render web fonts the same way the
 * export will. The iframe is written once (doc.write), so this upserts the
 * elements reactively rather than baking them into the initial markup.
 */
export function useIframeFonts(iframeDoc: Ref<Document | null>, editor: PageEditorInstance) {
  watch(
    [iframeDoc, () => editor.fontConfig.value],
    ([doc, config]) => {
      if (!doc)
        return
      const hrefs = fontStylesheetLinks(config.families)
      const existing = new Map(
        [...doc.querySelectorAll<HTMLLinkElement>(`link[${MARK}]`)].map(link => [link.href, link]),
      )
      // Drop links no longer needed.
      for (const [href, link] of existing) {
        if (!hrefs.includes(href))
          link.remove()
      }
      // Add the missing ones (order isn't significant for stylesheets).
      for (const href of hrefs) {
        if (existing.has(href))
          continue
        const link = doc.createElement('link')
        link.setAttribute(MARK, '')
        link.rel = 'stylesheet'
        link.href = href
        doc.head.appendChild(link)
      }
    },
    { immediate: true },
  )
}
