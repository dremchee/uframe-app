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
  const isCanvasResizeMode = shallowRef(false)
  const viewport = shallowRef<PageViewport>('responsive')
  const customWidth = shallowRef<number | null>(null)
  const spacingOverlay = shallowRef<SpacingOverlay | null>(null)

  function breakpointWidth(id: string): number | null {
    const breakpoint = breakpoints.value.find(candidate => candidate.id === id)
    return breakpoint ? breakpointUpperBound(breakpoint) : null
  }

  /**
   * The effective width interval in which an edited breakpoint wins in the
   * cascade. Adjacent min/max breakpoints meet at an exclusive edge because
   * both CSS media queries are inclusive.
   */
  function breakpointWidthBounds(id: string): { min: number, max: number | null } | null {
    const breakpoint = breakpoints.value.find(candidate => candidate.id === id)
    if (!breakpoint)
      return null

    if (breakpoint.direction === 'between')
      return { min: breakpoint.width, max: breakpoint.widthMax ?? breakpoint.width }

    const siblings = breakpoints.value.filter(candidate => candidate.direction === breakpoint.direction && candidate.id !== breakpoint.id)
    if (breakpoint.direction === 'max') {
      const narrower = siblings
        .filter(candidate => candidate.width < breakpoint.width)
        .reduce<number | null>((closest, candidate) => closest == null || candidate.width > closest ? candidate.width : closest, null)
      return { min: narrower == null ? 0 : narrower + 1, max: breakpoint.width }
    }

    const wider = siblings
      .filter(candidate => candidate.width > breakpoint.width)
      .reduce<number | null>((closest, candidate) => closest == null || candidate.width < closest ? candidate.width : closest, null)
    return { min: breakpoint.width, max: wider == null ? null : wider - 1 }
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

  function setCanvasResizeMode(value: boolean) {
    isCanvasResizeMode.value = value
  }

  function setCustomWidth(value: number) {
    const bounds = editBreakpoint.value === 'base' ? null : breakpointWidthBounds(editBreakpoint.value)
    const clamped = Math.max(bounds?.min ?? 0, value)
    customWidth.value = Math.round(bounds?.max == null ? clamped : Math.min(bounds.max, clamped))
  }

  function setSpacingOverlay(value: SpacingOverlay | null) {
    spacingOverlay.value = value
  }

  return {
    isPreviewMode,
    isCanvasResizeMode,
    viewport,
    customWidth,
    canvasWidth,
    spacingOverlay,
    setViewport,
    setEditBreakpoint,
    setCanvasResizeMode,
    setCustomWidth,
    setSpacingOverlay,
  }
}
