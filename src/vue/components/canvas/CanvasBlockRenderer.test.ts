// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { buttonDef } from '@/blocks/button'
import CanvasBlockRenderer from '@/vue/components/canvas/CanvasBlockRenderer.vue'

const apps: Array<{ unmount: () => void }> = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('canvasBlockRenderer attributes', () => {
  it('forwards safe custom attributes to a conditional first-party root', async () => {
    const container = document.createElement('div')
    const app = createApp(CanvasBlockRenderer, {
      block: {
        id: 'button-1',
        type: 'button',
        props: { label: 'Open', href: '#' },
        attributes: {
          'id': 'hero-action',
          'data-testid': 'hero-button',
          'aria-label': 'Open hero',
          'onclick': 'alert(1)',
        },
      },
      registry: { button: buttonDef },
    })
    app.mount(container)
    apps.push(app)
    await nextTick()

    const root = container.querySelector('a') as HTMLAnchorElement
    expect(root.id).toBe('hero-action')
    expect(root.dataset.testid).toBe('hero-button')
    expect(root.getAttribute('aria-label')).toBe('Open hero')
    expect(root.hasAttribute('onclick')).toBe(false)
  })
})
