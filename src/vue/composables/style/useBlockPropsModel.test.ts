import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useBlockPropsModel } from '@/vue/composables/style/useBlockPropsModel'

function block(id: string, text: string): PageBlock {
  return { id, type: 'heading', props: { text } } as PageBlock
}

// Drives the composable through the real selection lifecycle: mounts with no
// selection, then selects `a` (this load consumes the initial skip-emit guard),
// leaving edits to `a` live.
async function mountWithSelectionA() {
  const replaceBlockProps = vi.fn()
  const editor = { replaceBlockProps } as unknown as PageEditorInstance
  const selected = ref<PageBlock | undefined>(undefined)
  const scope = effectScope()
  let model!: ReturnType<typeof useBlockPropsModel>
  scope.run(() => {
    model = useBlockPropsModel(editor, selected)
  })
  await nextTick()
  selected.value = block('a', 'A')
  await nextTick()
  return { replaceBlockProps, selected, model, scope }
}

describe('useBlockPropsModel', () => {
  it('flushes the previous block\'s edit before switching (no cross-block data loss)', async () => {
    const { replaceBlockProps, selected, model, scope } = await mountWithSelectionA()

    // Edit block A…
    ;(model.localProps.value as { text: string }).text = 'edited-A'
    await nextTick() // deep watch captures the pending edit against 'a'

    // …then switch to B within the debounce window.
    selected.value = block('b', 'B')
    await nextTick() // id watcher flushes A synchronously, then loads B

    // A's edit was committed to A — not dropped, and not written to B.
    expect(replaceBlockProps).toHaveBeenCalledTimes(1)
    expect(replaceBlockProps).toHaveBeenCalledWith('a', expect.objectContaining({ text: 'edited-A' }))

    scope.stop()
  })

  it('flushes a pending edit on unmount', async () => {
    const { replaceBlockProps, model, scope } = await mountWithSelectionA()

    ;(model.localProps.value as { text: string }).text = 'edited-A'
    await nextTick()

    scope.stop() // onScopeDispose → flush
    expect(replaceBlockProps).toHaveBeenCalledWith('a', expect.objectContaining({ text: 'edited-A' }))
  })
})
