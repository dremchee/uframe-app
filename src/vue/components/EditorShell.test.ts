// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import EditorShell from './EditorShell.vue'

vi.mock('@/components/ui', async () => {
  const { defineComponent, h } = await import('vue')

  const ResizablePanel = defineComponent({
    props: {
      id: String,
      order: Number,
    },
    setup(props, { slots }) {
      return () => h('section', {
        'data-panel-id': props.id,
        'data-panel-order': props.order,
      }, slots.default?.({ resize: () => {} }))
    },
  })

  return {
    ResizableHandle: defineComponent({ setup: () => () => h('div') }),
    ResizablePanel,
    ResizablePanelGroup: defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.())
      },
    }),
  }
})

async function stubComponent() {
  const { defineComponent, h } = await import('vue')
  return { default: defineComponent({ setup: () => () => h('div') }) }
}

vi.mock('@/vue/components/CanvasViewport.vue', stubComponent)
vi.mock('@/vue/components/CssPreviewPanel.vue', stubComponent)
vi.mock('@/vue/components/EditorToolbar.vue', stubComponent)
vi.mock('@/vue/components/PagePreview.vue', stubComponent)
vi.mock('@/vue/components/PropertiesPanel.vue', stubComponent)
vi.mock('@/vue/components/SidebarPanels.vue', stubComponent)
vi.mock('@/vue/components/SidebarRail.vue', stubComponent)

vi.mock('@/vue/context/editor-context', async () => {
  const { shallowRef } = await import('vue')
  return {
    useEditorContext: () => ({
      editor: {
        canvasWidth: shallowRef('auto'),
        effectiveDocument: shallowRef({ blocks: [] }),
        isMultiPage: shallowRef(false),
        isPreviewMode: shallowRef(false),
        registry: shallowRef({}),
        revealInTreeRequest: shallowRef(null),
      },
      pluginSlots: { overlays: [], panels: [] },
    }),
  }
})

vi.mock('@/vue/composables/ui/useSidebar', async () => {
  const { shallowRef } = await import('vue')
  return {
    useSidebar: () => ({
      closeFlyout: () => {},
      flyoutOpen: shallowRef(false),
      mode: shallowRef('layers'),
      panelWidth: shallowRef(280),
      pinned: shallowRef(false),
      selectMode: () => {},
    }),
  }
})

vi.mock('@/vue/composables/ui/useEditorShellLayout', () => ({
  useEditorShellLayout: () => ({
    cssPreviewCollapsedSize: 33,
    startPanelResize: () => {},
    toggleCssPreview: () => {},
  }),
}))

vi.mock('@/vue/i18n', () => ({
  useUframeI18n: () => ({ t: (key: string) => key }),
}))

const mountedApps: Array<{ unmount: () => void }> = []

afterEach(() => {
  mountedApps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
})

describe('editor shell splitter layout', () => {
  it('keeps stable panel identity and order across hot updates', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(EditorShell, { toolbarVisible: false })
    app.mount(host)
    mountedApps.push(app)

    const panels = Array.from(host.querySelectorAll<HTMLElement>('[data-panel-id]'))
      .map(panel => [panel.dataset.panelId, Number(panel.dataset.panelOrder)])

    expect(panels).toEqual([
      ['uf-canvas-panel', 1],
      ['uf-properties-panel', 2],
      ['uf-properties-main-panel', 1],
      ['uf-css-preview-panel', 2],
    ])
  })
})
