import { useThrottleFn } from '@vueuse/core'
import { shallowRef } from 'vue'
import { baseBlockId } from '@/core'

type HoverSource = 'canvas' | 'tree'

/**
 * Keeps canonical block selection separate from a rendered preview instance,
 * while mirroring hover state between the canvas and the layers tree.
 */
export function useEditorSelection() {
  const selectedBlockId = shallowRef<string | null>(null)
  const selectionIntentNonce = shallowRef(0)
  const selectedInstanceId = shallowRef<string | null>(null)
  const hoveredInstanceId = shallowRef<string | null>(null)
  const hoveredBlockId = shallowRef<string | null>(null)
  const hoverSource = shallowRef<HoverSource | null>(null)
  const syncedHoverId = shallowRef<string | null>(null)
  const pushSyncedHover = useThrottleFn((id: string | null) => {
    syncedHoverId.value = id
  }, 60, true)

  function selectBlock(id: string | null) {
    selectionIntentNonce.value += 1
    selectedBlockId.value = id
    selectedInstanceId.value = null
  }

  function selectBlockInstance(domId: string | null) {
    const base = domId ? baseBlockId(domId) : null
    selectionIntentNonce.value += 1
    selectedBlockId.value = base
    selectedInstanceId.value = domId && base !== domId ? domId : null
  }

  function setHoveredBlock(id: string | null, source: HoverSource) {
    hoveredBlockId.value = id
    hoverSource.value = source
    hoveredInstanceId.value = null
    pushSyncedHover(id)
  }

  function setHoveredBlockInstance(domId: string | null) {
    const base = domId ? baseBlockId(domId) : null
    setHoveredBlock(base, 'canvas')
    hoveredInstanceId.value = domId && base !== domId ? domId : null
  }

  return {
    selectedBlockId,
    selectionIntentNonce,
    selectedInstanceId,
    hoveredInstanceId,
    hoveredBlockId,
    hoverSource,
    syncedHoverId,
    selectBlock,
    selectBlockInstance,
    setHoveredBlock,
    setHoveredBlockInstance,
  }
}
