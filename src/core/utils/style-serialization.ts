import type { BaseBlockStyles, FilterEntry, ShadowEntry } from '@/core/types/block-styles'
import { sanitizeCssValue } from '@/core/utils/css'
import { serializeFilters } from '@/core/utils/css-filters'
import { serializeShadows } from '@/core/utils/css-shadows'

function toKebabCase(camel: string): string {
  return camel.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

const NESTED_KEYS = new Set(['states', 'responsive'])

/** Serializes only the declarations owned by one style layer. */
export function serializeStyleDeclarations(styles: BaseBlockStyles | undefined): string {
  if (!styles)
    return ''

  const out: string[] = []
  for (const [key, raw] of Object.entries(styles)) {
    if (NESTED_KEYS.has(key) || raw === undefined || raw === null || raw === '')
      continue

    if (key === 'filter' || key === 'backdropFilter') {
      const cssValue = sanitizeCssValue(serializeFilters(raw as FilterEntry[]))
      if (!cssValue)
        continue
      if (key === 'backdropFilter')
        out.push(`-webkit-backdrop-filter: ${cssValue}`)
      out.push(`${toKebabCase(key)}: ${cssValue}`)
      continue
    }

    if (key === 'boxShadow') {
      const cssValue = sanitizeCssValue(serializeShadows(raw as ShadowEntry[]))
      if (!cssValue)
        continue
      out.push(`box-shadow: ${cssValue}`)
      continue
    }

    const cssValue = sanitizeCssValue(String(raw))
    if (cssValue)
      out.push(`${toKebabCase(key)}: ${cssValue}`)
  }
  return out.join('; ')
}
