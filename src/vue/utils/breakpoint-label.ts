import type { BreakpointDef } from '@/core'

/** Display the label saved in the breakpoint definition, without translating it. */
export function breakpointLabel(bp: BreakpointDef, _t: (key: string) => string): string {
  return bp.label
}
