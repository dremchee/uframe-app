// @vitest-environment jsdom
import type { ContainerPreviewChannel, PageEditorInstance } from '@/vue/context/editor-context'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, shallowRef } from 'vue'
import { useCanvasContainerPreview } from './useCanvasContainerPreview'

const mountedApps: Array<{ unmount: () => void }> = []

afterEach(() => {
  mountedApps.splice(0).forEach(app => app.unmount())
  vi.unstubAllGlobals()
})

function createPreviewChannel(): ContainerPreviewChannel {
  const active = shallowRef(false)
  const blockId = shallowRef<string | null>(null)
  const containerName = shallowRef<string | null>(null)
  const width = shallowRef<number | null>(null)
  const overrideWidth = shallowRef<number | null>(null)
  const highlighted = shallowRef(false)

  return {
    active,
    blockId,
    containerName,
    width,
    overrideWidth,
    highlighted,
    setActive: value => (active.value = value),
    show: (id, name) => {
      blockId.value = id
      containerName.value = name
    },
    hide: () => {
      blockId.value = null
      containerName.value = null
      width.value = null
      overrideWidth.value = null
      highlighted.value = false
    },
    reportWidth: value => (width.value = value),
    setOverrideWidth: value => (overrideWidth.value = value),
    setHighlighted: value => (highlighted.value = value),
  }
}

describe('useCanvasContainerPreview', () => {
  it('measures query width, applies a runtime-only width, and restores inline styles', async () => {
    vi.stubGlobal('CSS', { escape: (value: string) => value })
    const element = document.createElement('div')
    element.dataset.blockId = 'parent'
    element.style.width = '300px'
    element.style.boxSizing = 'border-box'
    element.style.padding = '0 10px'
    element.style.border = '1px solid'
    element.style.marginLeft = '12px'
    element.style.marginRight = '18px'
    element.getBoundingClientRect = vi.fn(() => {
      const width = Number.parseFloat(element.style.width) || 300
      return {
        top: 20,
        left: 30,
        width,
        height: 100,
        right: 30 + width,
        bottom: 120,
        x: 30,
        y: 20,
        toJSON: () => ({}),
      }
    })
    document.body.append(element)

    const preview = createPreviewChannel()
    const editor = {
      documentRevision: shallowRef(0),
    } as PageEditorInstance
    let exposed: ReturnType<typeof useCanvasContainerPreview> | undefined
    const host = document.createElement('div')
    const app = createApp(defineComponent({
      setup() {
        exposed = useCanvasContainerPreview({
          editor,
          preview,
          iframeDoc: shallowRef(document),
          iframeWin: shallowRef(window),
        })
        return () => null
      },
    }))
    app.mount(host)
    mountedApps.push(app)

    preview.show('parent', 'section')
    await nextTick()
    await nextTick()
    expect(exposed?.rect.value?.width).toBe(300)
    expect(preview.width.value).toBe(278)
    expect(element.style.getPropertyValue('container-name')).toBe('section')
    expect(element.style.getPropertyPriority('container-name')).toBe('important')

    preview.setOverrideWidth(240)
    await nextTick()
    expect(element.style.getPropertyPriority('width')).toBe('important')
    expect(element.style.width).toBe('240px')
    expect(element.style.marginLeft).toBe('auto')
    expect(element.style.marginRight).toBe('auto')
    expect(preview.width.value).toBe(218)

    preview.hide()
    await nextTick()
    await nextTick()
    expect(element.style.width).toBe('300px')
    expect(element.style.minWidth).toBe('')
    expect(element.style.maxWidth).toBe('')
    expect(element.style.flex).toBe('')
    expect(element.style.marginLeft).toBe('12px')
    expect(element.style.marginRight).toBe('18px')
    expect(element.style.containerType).toBe('')
    expect(element.style.containerName).toBe('')

    element.remove()
  })
})
