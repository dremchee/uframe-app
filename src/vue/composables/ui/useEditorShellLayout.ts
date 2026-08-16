import type { Ref } from 'vue'
import type { SidebarController } from '@/vue/composables/ui/useSidebar'
import { onClickOutside } from '@vueuse/core'
import { provide } from 'vue'
import { UI_PORTAL_TARGET } from '@/components/ui'

/**
 * Owns editor-shell layout interactions: the editor-local portal target,
 * floating sidebar dismissal and resize.
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

  return {
    startPanelResize,
  }
}
