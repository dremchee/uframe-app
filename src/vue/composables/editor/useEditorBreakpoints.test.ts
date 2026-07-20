import type { GlobalSettings, StyleViewport } from '@/core'
import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { createPageDocument } from '@/core'
import { useEditorBreakpoints } from './useEditorBreakpoints'

function createBreakpoints(globalsValue: GlobalSettings | null = null) {
  const document = shallowRef(createPageDocument({ title: 'Document' }))
  const globals = shallowRef<GlobalSettings | null>(globalsValue)
  const editBreakpoint = shallowRef<StyleViewport>('base')
  const breakpoints = useEditorBreakpoints({
    document,
    globals,
    editBreakpoint,
    commit: (next) => { document.value = next },
    commitGlobals: (next) => { globals.value = next },
  })
  return { document, globals, editBreakpoint, breakpoints }
}

describe('useEditorBreakpoints', () => {
  it('creates a unique id and supplies an upper bound for between ranges', () => {
    const state = createBreakpoints()
    const id = state.breakpoints.addBreakpoint({ label: ' Small ', direction: 'between', width: 480 })

    expect(id).toBe('Small')
    expect(state.breakpoints.breakpoints.value.at(-1)).toEqual({
      id: 'Small',
      label: 'Small',
      direction: 'between',
      width: 480,
      widthMax: 960,
    })
  })

  it('updates globals and resets the selected layer when removing a breakpoint', () => {
    const state = createBreakpoints({
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      breakpoints: [{ id: 'narrow', label: 'Narrow', direction: 'max', width: 600 }],
    })
    state.editBreakpoint.value = 'narrow'

    state.breakpoints.removeBreakpoint('narrow')

    expect(state.globals.value?.breakpoints).toEqual([])
    expect(state.editBreakpoint.value).toBe('base')
  })

  it('does not add or update a breakpoint with an existing range', () => {
    const state = createBreakpoints({
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      breakpoints: [{ id: 'narrow', label: 'Narrow', direction: 'max', width: 600 }],
    })

    expect(state.breakpoints.addBreakpoint({ label: 'Duplicate', direction: 'max', width: 600 })).toBeUndefined()
    expect(state.breakpoints.breakpoints.value).toHaveLength(1)
    expect(state.breakpoints.addBreakpoint({ label: 'Mobile', direction: 'max', width: 480 })).toBe('Mobile')
    expect(state.breakpoints.updateBreakpoint('narrow', { width: 480 })).toBe(false)
    expect(state.breakpoints.breakpoints.value.find(b => b.id === 'narrow')?.width).toBe(600)
  })
})
