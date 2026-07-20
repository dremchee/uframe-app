import type { Component } from 'vue'
import type { BreakpointDef } from '@/core'
import {
  Laptop,
  Monitor,
  RectangleHorizontal,
  Smartphone,
  Tablet,
  Tv,
} from '@lucide/vue'
import { breakpointUpperBound } from '@/core'

// The device icons a breakpoint can be tagged with. `key` is what's stored on
// BreakpointDef.icon (serializable); the component is resolved at render time.
export const BREAKPOINT_ICONS: Array<{ key: string, label: string, icon: Component }> = [
  { key: 'monitor', label: 'Desktop', icon: Monitor },
  { key: 'tv', label: 'TV', icon: Tv },
  { key: 'laptop', label: 'Laptop', icon: Laptop },
  { key: 'tablet', label: 'Tablet', icon: Tablet },
  { key: 'tablet-landscape', label: 'Tablet landscape', icon: RectangleHorizontal },
  { key: 'smartphone', label: 'Phone', icon: Smartphone },
]

const BY_KEY = new Map(BREAKPOINT_ICONS.map(i => [i.key, i.icon]))

/** Suggested icon key from a breakpoint's width/direction, used when none is set. */
export function autoIconKey(bp: Pick<BreakpointDef, 'direction' | 'width' | 'widthMax'>): string {
  const w = breakpointUpperBound(bp)
  if (bp.direction === 'min' || w > 1024)
    return 'monitor'
  if (w > 768)
    return 'tablet'
  return 'smartphone'
}

/** Resolve a breakpoint to its icon component (explicit choice or width-derived). */
export function breakpointIcon(bp: BreakpointDef): Component {
  return BY_KEY.get(bp.icon ?? autoIconKey(bp)) ?? Monitor
}
