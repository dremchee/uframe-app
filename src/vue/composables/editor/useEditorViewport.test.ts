import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { useEditorViewport } from './useEditorViewport'

describe('useEditorViewport', () => {
  it('uses the selected breakpoint upper bound unless a custom width overrides it', () => {
    const editBreakpoint = shallowRef<'base' | 'narrow'>('base')
    const viewport = useEditorViewport({
      editBreakpoint,
      breakpoints: shallowRef([{ id: 'narrow', label: 'Narrow', direction: 'between', width: 480, widthMax: 720 }]),
    })

    viewport.setEditBreakpoint('narrow')
    expect(viewport.canvasWidth.value).toBe(720)
    viewport.customWidth.value = 640
    expect(viewport.canvasWidth.value).toBe(640)
  })

  it('syncs device presets to matching breakpoint ids', () => {
    const editBreakpoint = shallowRef<'base' | 'tablet'>('base')
    const viewport = useEditorViewport({
      editBreakpoint,
      breakpoints: shallowRef([{ id: 'tablet', label: 'Tablet', direction: 'max', width: 900 }]),
    })

    viewport.setViewport('tablet')

    expect(editBreakpoint.value).toBe('tablet')
    expect(viewport.viewport.value).toBe('tablet')
  })
})
