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
    viewport.setCustomWidth(640)
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

  it('keeps manual canvas resizing as editor-only state', () => {
    const viewport = useEditorViewport({
      editBreakpoint: shallowRef<'base'>('base'),
      breakpoints: shallowRef([]),
    })

    viewport.setCanvasResizeMode(true)
    viewport.setCustomWidth(641.6)

    expect(viewport.isCanvasResizeMode.value).toBe(true)
    expect(viewport.customWidth.value).toBe(642)
    expect(viewport.canvasWidth.value).toBe(642)
  })

  it('constrains a manual width to the active breakpoint interval', () => {
    const editBreakpoint = shallowRef<'base' | 'tablet' | 'mobile' | 'wide'>('base')
    const viewport = useEditorViewport({
      editBreakpoint,
      breakpoints: shallowRef([
        { id: 'wide', label: 'Wide', direction: 'min', width: 1440 },
        { id: 'tablet', label: 'Tablet', direction: 'max', width: 1024 },
        { id: 'mobile', label: 'Mobile', direction: 'max', width: 768 },
      ]),
    })

    viewport.setEditBreakpoint('tablet')
    viewport.setCustomWidth(700)
    expect(viewport.canvasWidth.value).toBe(769)
    viewport.setCustomWidth(1200)
    expect(viewport.canvasWidth.value).toBe(1024)

    viewport.setEditBreakpoint('wide')
    viewport.setCustomWidth(1200)
    expect(viewport.canvasWidth.value).toBe(1440)
  })
})
