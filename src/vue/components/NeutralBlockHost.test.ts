// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import NeutralBlockHost from '@/vue/components/NeutralBlockHost.vue'

// A minimal custom element to host. jsdom supports customElements.define +
// upgrade, so document.createElement('uf-test-el') yields an upgraded instance.
class TestEl extends HTMLElement {}
if (!customElements.get('uf-test-el'))
  customElements.define('uf-test-el', TestEl)

const apps: Array<{ unmount: () => void }> = []

function mount(props: Record<string, unknown>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp(NeutralBlockHost, props)
  app.mount(container)
  apps.push(app)
  return container
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('neutralBlockHost', () => {
  it('creates the custom element with class, id, props and attribute mirrors', async () => {
    const container = mount({
      tag: 'uf-test-el',
      blockProps: { tone: 'info', text: 'Hi', count: 3 },
      elementClass: ['uf-block-x', 'uf-cls-card'],
      elementId: 'my-id',
    })
    await nextTick()

    const el = container.querySelector('uf-test-el') as HTMLElement & { tone?: string }
    expect(el).toBeTruthy()
    expect(el.className).toBe('uf-block-x uf-cls-card')
    expect(el.id).toBe('my-id')
    // Primitives mirrored to attributes (for observedAttributes-style elements).
    expect(el.getAttribute('tone')).toBe('info')
    expect(el.getAttribute('count')).toBe('3')
    // …and pushed as DOM properties (for elements that read properties).
    expect(el.tone).toBe('info')
  })

  it('reacts to prop changes', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({
      components: { NeutralBlockHost },
      data: () => ({ props: { tone: 'info' } }),
      template: '<NeutralBlockHost tag="uf-test-el" :block-props="props" />',
    })
    app.mount(container)
    apps.push(app)
    await nextTick()

    const el = container.querySelector('uf-test-el') as HTMLElement
    expect(el.getAttribute('tone')).toBe('info')

    ;(app._instance!.data as { props: Record<string, unknown> }).props.tone = 'danger'
    await nextTick()
    expect(el.getAttribute('tone')).toBe('danger')
  })
})
