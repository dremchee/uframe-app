import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/**
 * Close a floating UI (popover / menu / flyout) when focus leaves the top
 * window — most often because the user clicked into the canvas iframe. reka-ui
 * only dismisses on an outside click within the *same* document, so an
 * interaction in the iframe (a separate document) doesn't count and the popover
 * would otherwise stay stuck open. Pass the `open` model and this closes it on
 * window blur.
 */
export function useDismissOnCanvasFocus(open: Ref<boolean>): void {
  useEventListener(window, 'blur', () => {
    open.value = false
  })
}
