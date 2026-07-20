import { describe, expect, it } from 'vitest'
import { useEditorSelection } from './useEditorSelection'

describe('useEditorSelection', () => {
  it('keeps a rendered copy alongside its canonical selected block', () => {
    const selection = useEditorSelection()

    selection.selectBlockInstance('card~2')

    expect(selection.selectedBlockId.value).toBe('card')
    expect(selection.selectedInstanceId.value).toBe('card~2')
    expect(selection.selectionIntentNonce.value).toBe(1)

    selection.selectBlock('heading')
    expect(selection.selectedBlockId.value).toBe('heading')
    expect(selection.selectedInstanceId.value).toBeNull()
    expect(selection.selectionIntentNonce.value).toBe(2)
  })

  it('keeps the exact preview copy for canvas hover only', () => {
    const selection = useEditorSelection()

    selection.setHoveredBlockInstance('card~1')
    expect(selection.hoveredBlockId.value).toBe('card')
    expect(selection.hoveredInstanceId.value).toBe('card~1')
    expect(selection.hoverSource.value).toBe('canvas')

    selection.setHoveredBlock('heading', 'tree')
    expect(selection.hoveredBlockId.value).toBe('heading')
    expect(selection.hoveredInstanceId.value).toBeNull()
    expect(selection.hoverSource.value).toBe('tree')
  })
})
