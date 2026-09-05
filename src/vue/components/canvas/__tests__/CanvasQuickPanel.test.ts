// @vitest-environment jsdom
import type { StyleTarget } from '@/vue/composables/style/useStyleTarget'
import type { PageEditorContext } from '@/vue/context/editor-context'
import { expect, it } from 'vitest'
import { createApp, h, nextTick, provide, shallowRef } from 'vue'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { createBlockRegistry } from '@/core'
import CanvasQuickPanel from '@/vue/components/canvas/CanvasQuickPanel.vue'
import { usePageEditor } from '@/vue/composables/editor/usePageEditor'
import { provideStyleTarget } from '@/vue/composables/style/useStyleTarget'
import { pageEditorContextKey } from '@/vue/context/editor-context'

it('shows the actual target and updates its breakpoint and state context', async () => {
  let editor!: ReturnType<typeof usePageEditor>
  let target!: StyleTarget
  const root = document.createElement('div')
  document.body.append(root)
  const trigger = document.createElement('button')
  trigger.setAttribute('data-uf-quick-panel-trigger', '')
  const app = createApp({
    setup() {
      editor = usePageEditor({ blocks: createBlockRegistry(defaultBlockDefinitions) })
      editor.addBlock('element', null, 'v-stack')
      editor.storage.value.quickPanelOpen = true
      provide(pageEditorContextKey, {
        editor,
        canvas: {
          paneEl: shallowRef<HTMLElement | null>(root),
          frameEl: shallowRef(null),
          selectionRect: shallowRef(null),
          selectionRadius: shallowRef(null),
          busy: shallowRef(false),
        },
      } as PageEditorContext)
      target = provideStyleTarget(editor)
      return () => h(CanvasQuickPanel)
    },
  })
  try {
    app.mount(root)
    root.append(trigger)
    await nextTick()
    const context = () => root.querySelector('[aria-live="polite"]')!.textContent!
    expect(context()).toContain('all widths')
    expect(context()).toContain('Default')
    target.blockSlice.value = { ...target.blockSlice.value, gap: '24px' }
    await nextTick()
    expect(context()).toContain(editor.selectedBlock.value!.classes![0]!)
    const breakpoint = editor.breakpoints.value[0]!
    target.viewport.value = breakpoint.id
    await nextTick()
    expect(context()).toContain(breakpoint.label)
    target.styleState.value = 'hover'
    await nextTick()
    expect(context()).toContain('all widths')
    expect(context()).toContain('Hover')
    target.styleState.value = 'default'
    await nextTick()
    expect(context()).toContain(breakpoint.label)
    root.querySelector('[role=dialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(root.querySelector('[role=dialog]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  }
  finally {
    app.unmount()
    root.remove()
  }
})
