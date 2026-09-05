// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createApp, shallowRef } from 'vue'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { createBlockRegistry } from '@/core'
import { useCanvasOverlayGeometry } from '@/vue/composables/canvas/useCanvasOverlayGeometry'
import { usePageEditor } from '@/vue/composables/editor/usePageEditor'

it.each(['grid', 'flex'])('only exposes %s overlays for editable containers', (display) => {
  // Generated block IDs contain only selector-safe letters, digits and underscores.
  vi.stubGlobal('CSS', { escape: (value: string) => value })
  const root = document.createElement('div')
  const box = document.createElement('div')
  box.style.display = display
  document.body.append(box)
  let editor!: ReturnType<typeof usePageEditor>
  let geometry!: ReturnType<typeof useCanvasOverlayGeometry>
  const app = createApp({
    setup() {
      editor = usePageEditor({ blocks: createBlockRegistry(defaultBlockDefinitions) })
      geometry = useCanvasOverlayGeometry({
        editor,
        iframeDoc: shallowRef(document),
        iframeWin: shallowRef(window),
        hoveredBlockId: shallowRef(null),
      })
      return () => null
    },
  })
  try {
    app.mount(root)
    editor.addBlock('element')
    box.dataset.blockId = editor.selectedBlockId.value!
    geometry.recomputeGrid()
    geometry.recomputeFlex()
    expect(display === 'grid' ? geometry.gridBox.value : geometry.flexBox.value).not.toBeNull()

    editor.addBlock('placeholder')
    box.dataset.blockId = editor.selectedBlockId.value!
    geometry.recomputeGrid()
    geometry.recomputeFlex()
    expect(geometry.gridBox.value).toBeNull()
    expect(geometry.flexBox.value).toBeNull()
  }
  finally {
    app.unmount()
    box.remove()
    vi.unstubAllGlobals()
  }
})
