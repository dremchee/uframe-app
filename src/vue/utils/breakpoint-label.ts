import type { BreakpointDef } from '@/core'

const DEFAULT_LABEL_KEYS: Record<string, string> = {
  wide: 'breakpoints.defaultWide',
  tablet: 'breakpoints.defaultTablet',
  mobile: 'breakpoints.defaultMobile',
  mobileSm: 'breakpoints.defaultMobileSmall',
}

/** Translate built-in breakpoint names while preserving custom user labels. */
export function breakpointLabel(bp: BreakpointDef, t: (key: string) => string): string {
  const key = DEFAULT_LABEL_KEYS[bp.id]
  if (!key)
    return bp.label
  const translated = t(key)
  return translated === key ? bp.label : translated
}
