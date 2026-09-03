// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, getCurrentInstance, h } from 'vue'
import Tooltip from '@/components/ui/tooltip/Tooltip.vue'

vi.mock('reka-ui', () => {
  const Passthrough = defineComponent({
    inheritAttrs: false,
    setup(_, { slots }) {
      return () => slots.default?.()
    },
  })

  const TooltipRoot = defineComponent({
    inheritAttrs: false,
    setup(_, { slots }) {
      const instance = getCurrentInstance()
      return () => h('div', {
        'data-has-open': Object.hasOwn(instance?.vnode.props ?? {}, 'open'),
      }, slots.default?.())
    },
  })

  return {
    TooltipContent: Passthrough,
    TooltipPortal: Passthrough,
    TooltipProvider: Passthrough,
    TooltipRoot,
    TooltipTrigger: Passthrough,
  }
})

const apps: Array<{ unmount: () => void }> = []
const containers: HTMLElement[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  containers.splice(0).forEach(container => container.remove())
})

function mountTooltip(template: string) {
  const container = document.createElement('div')
  document.body.append(container)
  containers.push(container)

  const app = createApp({
    components: { Tooltip },
    template,
  })
  app.mount(container)
  apps.push(app)

  return container
}

describe('tooltip', () => {
  it('omits the open prop in uncontrolled mode', () => {
    const container = mountTooltip(`
      <Tooltip text="Helpful context">
        <button type="button">Info</button>
      </Tooltip>
    `)

    expect(container.querySelector('[data-has-open]')?.getAttribute('data-has-open')).toBe('false')
  })

  it('forwards the open prop in controlled mode', () => {
    const container = mountTooltip(`
      <Tooltip text="Helpful context" :open="false">
        <button type="button">Info</button>
      </Tooltip>
    `)

    expect(container.querySelector('[data-has-open]')?.getAttribute('data-has-open')).toBe('true')
  })
})
