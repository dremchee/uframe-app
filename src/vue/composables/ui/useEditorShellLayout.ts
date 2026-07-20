import type { Ref } from 'vue'
import type { SidebarController } from '@/vue/composables/ui/useSidebar'
import { onClickOutside } from '@vueuse/core'
import { provide, ref } from 'vue'
import { UI_PORTAL_TARGET } from '@/components/ui'

const CSS_PREVIEW_COLLAPSED_SIZE = 33 // h-8 (32px) + 1px top border
const CSS_PREVIEW_EXPANDED_SIZE = 280

/**
 * Owns editor-shell layout interactions: the editor-local portal target,
 * floating sidebar dismissal and resize, plus CSS preview panel sizing.
 */
interface UseEditorShellLayoutOptions {
  sidebar: SidebarController
  rootEl: Ref<HTMLElement | null>
  flyoutRef: Ref<HTMLElement | null>
}

export function useEditorShellLayout(options: UseEditorShellLayoutOptions) {
  const { sidebar, rootEl, flyoutRef } = options
  // All reka-ui overlays render under the editor root rather than <body>, so
  // embedded editors retain their reset and never leak overlays into the host.
  provide(UI_PORTAL_TARGET, rootEl)

  onClickOutside(
    flyoutRef,
    (event) => {
      const target = event.target as Element | null
      // Nested reka overlays temporarily disable pointer events behind them;
      // the resulting click on <body> merely closes the nested overlay.
      if (!target || target === document.documentElement || target === document.body)
        return
      if (target.closest?.('.uf-overlay'))
        return
      sidebar.closeFlyout()
    },
    {
      // The rail opens the flyout and this handle resizes it; neither is an
      // outside interaction. `detectIframe` handles focus moving to canvas.
      ignore: ['.uf-sidebar-rail', '.uf-flyout-resize', '.uf-overlay'],
      detectIframe: true,
    },
  )

  function startPanelResize(event: PointerEvent) {
    event.preventDefault()
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startWidth = sidebar.panelWidth.value
    function onMove(moveEvent: PointerEvent) {
      sidebar.panelWidth.value = startWidth + (moveEvent.clientX - startX)
    }
    function onUp(upEvent: PointerEvent) {
      handle.releasePointerCapture(upEvent.pointerId)
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
    }
    document.body.style.userSelect = 'none'
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  const cssPreviewCollapsed = ref(true)
  function toggleCssPreview(resize: (size: number) => void) {
    const next = cssPreviewCollapsed.value
      ? CSS_PREVIEW_EXPANDED_SIZE
      : CSS_PREVIEW_COLLAPSED_SIZE
    resize(next)
    cssPreviewCollapsed.value = !cssPreviewCollapsed.value
  }

  return {
    startPanelResize,
    toggleCssPreview,
    cssPreviewCollapsed,
    cssPreviewCollapsedSize: CSS_PREVIEW_COLLAPSED_SIZE,
  }
}
