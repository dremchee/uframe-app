// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import EmbedBlock from '@/blocks/embed/EmbedBlock.vue'
import { embedTrustKey } from '@/vue/context/embed-trust'

const apps: Array<{ unmount: () => void }> = []

function mount(html: string, attributes: Record<string, unknown> = {}, untrusted = false) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp(EmbedBlock, { props: { html }, ...attributes })
  app.provide(embedTrustKey, () => untrusted)
  app.mount(container)
  apps.push(app)
  return container
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('embedBlock', () => {
  it.each([
    ['trusted HTML', '<svg></svg>', false, 'div', ['uf-embed-block', 'uf-no-click']],
    ['untrusted HTML', '<svg></svg>', true, 'iframe', ['uf-embed-block', 'uf-no-click']],
    ['empty content', '', false, 'div', ['uf-embed-block', 'uf-container-placeholder']],
  ])('forwards public classes and ids onto the %s root', async (_, html, untrusted, tag, baseClasses) => {
    const container = mount(html, { id: 'feature-icon', class: 'feature-icon' }, untrusted)
    await nextTick()

    const embed = container.querySelector(`${tag}#feature-icon`)
    expect(embed).toBeTruthy()
    for (const className of baseClasses)
      expect(embed?.classList.contains(className)).toBe(true)
    expect(embed?.classList.contains('feature-icon')).toBe(true)
  })
})
