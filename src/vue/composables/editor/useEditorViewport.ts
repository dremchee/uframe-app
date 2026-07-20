import type { Ref, ShallowRef } from 'vue'
import type { BreakpointDef, PageViewport, StyleViewport } from '@/core'
import { computed, shallowRef } from 'vue'
import { breakpointUpperBound } from '@/core'

export interface UseEditorViewportOptions {
  breakpoints: Readonly<Ref<BreakpointDef[]>>
  editBreakpoint: ShallowRef<StyleViewport>
}

export interface SpacingOverlay {
  group: 'margin' | 'padding'
  side: 'Top' | 'Right' | 'Bottom' | 'Left'
}

/** Canvas-only viewport and spacing-overlay state. */
export function useEditorViewport(options: UseEditorViewportOptions) {
  const { breakpoints, editBreakpoint } = options
  const isPreviewMode = shallowRef(false)
  const viewport = shallowRef<PageViewport>('responsive')
  const customWidth = shallowRef<number | null>(null)
  const spacingOverlay = shallowRef<SpacingOverlay | null>(null)

  function breakpointWidth(id: string): number | null {
    const breakpoint = breakpoints.value.find(candidate => candidate.id === id)
    return breakpoint ? breakpointUpperBound(breakpoint) : null
  }

  const canvasWidth = computed(() => {
    if (customWidth.value != null)
      return customWidth.value
    if (editBreakpoint.value !== 'base')
      return breakpointWidth(editBreakpoint.value)
    return viewport.value === 'desktop' ? 1120 : null
  })

  function setViewport(value: PageViewport) {
    customWidth.value = null
    viewport.value = value
    const matchesId = (value === 'tablet' || value === 'mobile') && breakpoints.value.some(breakpoint => breakpoint.id === value)
    editBreakpoint.value = matchesId ? value : 'base'
  }

  function setEditBreakpoint(value: StyleViewport) {
    customWidth.value = null
    editBreakpoint.value = value
    if (value === 'tablet' || value === 'mobile')
      viewport.value = value
    else if (value === 'base' && viewport.value !== 'desktop')
      viewport.value = 'responsive'
  }

  function setSpacingOverlay(value: SpacingOverlay | null) {
    spacingOverlay.value = value
  }

  return {
    isPreviewMode,
    viewport,
    customWidth,
    canvasWidth,
    spacingOverlay,
    setViewport,
    setEditBreakpoint,
    setSpacingOverlay,
  }
}
