// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import CanvasWidthResizeControls from './CanvasWidthResizeControls.vue'

const mountedApps: Array<{ unmount: () => void }> = []

afterEach(() => {
  mountedApps.splice(0).forEach(app => app.unmount())
  vi.restoreAllMocks()
})

function pointerEvent(type: string, clientX: number): PointerEvent {
  const event = new MouseEvent(type, { bubbles: true, clientX })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return event as PointerEvent
}

describe('canvas width resize controls', () => {
  it('uses the shared canvas resize rule for a container handle drag', () => {
    const onWidth = vi.fn()
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({
      render: () => h(CanvasWidthResizeControls, {
        'width': 640,
        'maxWidth': 900,
        'label': 'Resize',
        'onUpdate:width': onWidth,
      }),
    })
    app.mount(host)
    mountedApps.push(app)

    const rightHandle = host.querySelector<HTMLElement>('[data-resize-side="right"]')
    expect(rightHandle).not.toBeNull()
    Object.defineProperty(rightHandle, 'setPointerCapture', { value: vi.fn() })

    rightHandle?.dispatchEvent(pointerEvent('pointerdown', 100))
    rightHandle?.dispatchEvent(pointerEvent('pointermove', 160.4))

    expect(onWidth).toHaveBeenLastCalledWith(700)
  })

  it('keeps the dragged handle under the pointer during centered resize', () => {
    const onWidth = vi.fn()
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp({
      render: () => h(CanvasWidthResizeControls, {
        'width': 640,
        'maxWidth': 900,
        'label': 'Resize',
        'centered': true,
        'onUpdate:width': onWidth,
      }),
    })
    app.mount(host)
    mountedApps.push(app)

    const rightHandle = host.querySelector<HTMLElement>('[data-resize-side="right"]')
    expect(rightHandle).not.toBeNull()
    Object.defineProperty(rightHandle, 'setPointerCapture', { value: vi.fn() })

    rightHandle?.dispatchEvent(pointerEvent('pointerdown', 100))
    rightHandle?.dispatchEvent(pointerEvent('pointermove', 160.4))

    expect(onWidth).toHaveBeenLastCalledWith(761)
  })
})
