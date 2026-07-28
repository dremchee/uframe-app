// @vitest-environment jsdom
import type { HtmlAttributes } from '@/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import AttributesSection from '@/vue/components/AttributesSection.vue'

const apps: Array<{ unmount: () => void }> = []
const containers: HTMLElement[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  containers.splice(0).forEach(container => container.remove())
})

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function openAddPopover(container: HTMLElement) {
  const addButton = [...container.querySelectorAll('button')]
    .find(button => button.textContent?.includes('Add attribute'))
  ;(addButton as HTMLButtonElement).click()
  await nextTick()
}

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

describe('attributesSection', () => {
  it('adds custom attributes from a vertical popover form', async () => {
    const attributes = ref<HtmlAttributes>({})
    const container = document.createElement('div')
    document.body.append(container)
    containers.push(container)
    const app = createApp({
      components: { AttributesSection },
      setup: () => ({ attributes }),
      template: '<AttributesSection v-model="attributes" />',
    })
    app.mount(container)
    apps.push(app)

    expect(container.textContent).toContain('Add attribute')
    expect(container.textContent).not.toContain('No attributes yet.')
    expect(container.textContent).not.toContain('Custom, data-* and aria-* attributes are supported.')
    expect(container.querySelector('[aria-label="More info about attributes"]')).not.toBeNull()

    await openAddPopover(container)

    const form = document.body.querySelector('form') as HTMLFormElement
    expect(form.classList).toContain('flex-col')
    const [nameInput, valueInput] = [...form.querySelectorAll('input')] as HTMLInputElement[]
    setInputValue(nameInput!, 'DATA-TestId')
    setInputValue(valueInput!, 'hero')
    submit(form)
    await nextTick()
    expect(attributes.value).toEqual({ 'data-testid': 'hero' })
    expect(container.textContent).toContain('data-testid')
    expect(container.textContent).toContain('hero')
    expect(container.querySelector('.h-9')).not.toBeNull()
  })

  it('keeps invalid event handlers out of the model', async () => {
    const attributes = ref<HtmlAttributes>({})
    const container = document.createElement('div')
    document.body.append(container)
    containers.push(container)
    const app = createApp({
      components: { AttributesSection },
      setup: () => ({ attributes }),
      template: '<AttributesSection v-model="attributes" />',
    })
    app.mount(container)
    apps.push(app)

    await openAddPopover(container)

    const form = document.body.querySelector('form') as HTMLFormElement
    const nameInput = form.querySelector('input') as HTMLInputElement
    setInputValue(nameInput!, 'onclick')
    submit(form)
    await nextTick()
    expect(attributes.value).toEqual({})
    expect(document.body.textContent).toContain('Inline event handlers are not allowed.')
  })

  it('edits an existing attribute from its row popover', async () => {
    const attributes = ref<HtmlAttributes>({ title: 'Hero' })
    const container = document.createElement('div')
    document.body.append(container)
    containers.push(container)
    const app = createApp({
      components: { AttributesSection },
      setup: () => ({ attributes }),
      template: '<AttributesSection v-model="attributes" />',
    })
    app.mount(container)
    apps.push(app)

    ;(container.querySelector('[aria-label="Edit attribute"]') as HTMLButtonElement).click()
    await nextTick()

    const form = document.body.querySelector('form') as HTMLFormElement
    const [nameInput, valueInput] = [...form.querySelectorAll('input')] as HTMLInputElement[]
    setInputValue(nameInput!, 'aria-label')
    setInputValue(valueInput!, 'Main hero')
    submit(form)
    await nextTick()

    expect(attributes.value).toEqual({ 'aria-label': 'Main hero' })
    expect(container.textContent).toContain('aria-label')
    expect(container.textContent).toContain('Main hero')
  })
})
