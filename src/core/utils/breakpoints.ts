import type { BreakpointDef } from '@/core/types/block-styles'
import type { PageSettings } from '@/core/types/page-document'
import { DEFAULT_BREAKPOINTS } from '@/core/types/block-styles'

/** The document's breakpoints, or the built-in seed set when none are defined. */
export function resolveBreakpoints(settings: Pick<PageSettings, 'breakpoints'>): BreakpointDef[] {
  return settings.breakpoints?.length ? settings.breakpoints : DEFAULT_BREAKPOINTS
}

/** Upper width bound used for previewing, visual ordering, and device hints. */
export function breakpointUpperBound(breakpoint: Pick<BreakpointDef, 'direction' | 'width' | 'widthMax'>): number {
  return breakpoint.direction === 'between' ? (breakpoint.widthMax ?? breakpoint.width) : breakpoint.width
}

/** Compact, locale-neutral range label for breakpoint controls and hints. */
export function breakpointRangeLabel(breakpoint: Pick<BreakpointDef, 'direction' | 'width' | 'widthMax'>): string {
  if (breakpoint.direction === 'between' && breakpoint.widthMax !== undefined)
    return `${breakpoint.width}–${breakpoint.widthMax}px`
  return `${breakpoint.direction === 'min' ? '≥' : '≤'}${breakpoint.width}px`
}

/**
 * Cascade/emit order, independent of authoring order: min-width (desktop-up)
 * ascending, then max-width (mobile-down) widest → narrowest. Emitting in this
 * order means the narrowest max-width rule wins at small widths and the widest
 * min-width rule wins at large widths on equal specificity.
 */
export function breakpointsInCascadeOrder(list: BreakpointDef[]): BreakpointDef[] {
  const min = list.filter(b => b.direction === 'min').sort((a, b) => a.width - b.width)
  const max = list.filter(b => b.direction === 'max').sort((a, b) => b.width - a.width)
  // `between` windows are emitted last (narrowest window first) so they win over
  // an overlapping min/max rule of equal specificity.
  const between = list
    .filter(b => b.direction === 'between')
    .sort((a, b) => (breakpointUpperBound(a) - a.width) - (breakpointUpperBound(b) - b.width))
  return [...min, ...max, ...between]
}

/**
 * Ids of the breakpoints a given breakpoint inherits before its own override,
 * in apply order. A breakpoint inherits the same-direction breakpoints whose
 * media query also matches at its threshold: for max-width, the wider ones
 * (widest → narrowest); for min-width, the smaller ones (smallest → largest).
 */
export function inheritedBreakpointIds(list: BreakpointDef[], id: string): string[] {
  const self = list.find(b => b.id === id)
  // `between` windows are self-contained — they inherit base only.
  if (!self || self.direction === 'between')
    return []
  const same = list.filter(b => b.direction === self.direction && b.id !== id)
  const ancestors = self.direction === 'max'
    ? same.filter(b => b.width > self.width).sort((a, b) => b.width - a.width)
    : same.filter(b => b.width < self.width).sort((a, b) => a.width - b.width)
  return ancestors.map(b => b.id)
}
