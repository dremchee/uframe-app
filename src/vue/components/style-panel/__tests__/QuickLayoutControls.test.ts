// @vitest-environment jsdom
import type { PageEditorContext } from '@/vue/context/editor-context'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, provide } from 'vue'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { createBlockRegistry } from '@/core'
import QuickLayoutControls from '@/vue/components/style-panel/QuickLayoutControls.vue'
import { usePageEditor } from '@/vue/composables/editor/usePageEditor'
import { provideStyleTarget } from '@/vue/composables/style/useStyleTarget'
import { pageEditorContextKey } from '@/vue/context/editor-context'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()))

async function mountControls(preset = 'grid') {
  let editor!: ReturnType<typeof usePageEditor>
  const root = document.createElement('div')
  document.body.append(root)
  const app = createApp({
    setup() {
      editor = usePageEditor({ blocks: createBlockRegistry(defaultBlockDefinitions) })
      editor.addBlock('element', null, preset)
      provide(pageEditorContextKey, { editor } as PageEditorContext)
      const target = provideStyleTarget(editor)
      return () => h(QuickLayoutControls, {
        'compact': true,
        'block': target.block.value,
        'modelValue': target.blockSlice.value,
        'onUpdate:modelValue': value => target.blockSlice.value = value,
      })
    },
  })
  app.mount(root)
  cleanups.push(() => {
    app.unmount()
    root.remove()
  })
  await nextTick()
  const button = (label: string) => {
    const element = root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)
    expect(element).not.toBeNull()
    return element!
  }
  return { editor, root, button }
}

describe('quick layout actions', () => {
  it('inserts a preset, edits its layout, and undoes both changes independently', async () => {
    const { editor, button } = await mountControls('v-stack')
    expect(editor.selectedBlock.value?.name).toBe('V Stack')
    const original = JSON.parse(JSON.stringify(editor.document.value.blocks))
    button('Horizontal stack').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    const block = editor.selectedBlock.value!
    expect(block.classes).toHaveLength(1)
    expect(editor.document.value.styles?.[block.classes![0]!]?.flexDirection).toBe('row')
    editor.undo()
    await nextTick()
    expect(editor.document.value.blocks).toEqual(original)
    editor.undo()
    await nextTick()
    expect(editor.document.value.blocks).toEqual([])
  })

  it('adds and removes empty cells while keeping the container selected, with undo', async () => {
    const { editor, button } = await mountControls()
    const id = editor.selectedBlockId.value
    button('Add element').click()
    await nextTick()
    expect(editor.selectedBlockId.value).toBe(id)
    expect(editor.selectedBlock.value?.children).toHaveLength(4)
    button('Remove last empty element').click()
    await nextTick()
    expect(editor.selectedBlock.value?.children).toHaveLength(3)
    editor.undo()
    await nextTick()
    expect(editor.selectedBlock.value?.children).toHaveLength(4)
  })

  it.each(['text', 'image', 'placeholder'])('does not delete a trailing %s block', async (type) => {
    const { editor, button } = await mountControls()
    const id = editor.selectedBlockId.value!
    editor.addBlock(type, id)
    editor.selectBlock(id)
    await nextTick()
    expect(button('Remove last empty element').disabled).toBe(true)
    button('Remove last empty element').click()
    await nextTick()
    expect(editor.selectedBlock.value?.children?.at(-1)?.type).toBe(type)
    expect(editor.selectedBlock.value?.children).toHaveLength(4)
  })
})
