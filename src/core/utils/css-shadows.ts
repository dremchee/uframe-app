import type { ShadowEntry } from '@/core/types/block-styles'
import { splitCssTopLevel } from '@/core/utils/css-tokenizer'
import { createUniqueId } from '@/core/utils/ids'

/** A new, enabled outer shadow with sensible defaults (mirrors the design mock). */
export function defaultShadow(): ShadowEntry {
  return { id: createUniqueId('shd'), enabled: true, inset: false, x: 0, y: 2, blur: 5, spread: 0, color: 'rgba(0, 0, 0, 0.2)' }
}

function serializeEntry(entry: ShadowEntry): string {
  const parts = [
    `${entry.x ?? 0}px`,
    `${entry.y ?? 0}px`,
    `${entry.blur ?? 0}px`,
    `${entry.spread ?? 0}px`,
    entry.color || 'rgba(0, 0, 0, 0.5)',
  ]
  if (entry.inset)
    parts.unshift('inset')
  return parts.join(' ')
}

/**
 * Join the enabled shadows into a comma-separated CSS `box-shadow` value, in
 * list order. Returns '' when there's nothing enabled to render.
 */
export function serializeShadows(list: ShadowEntry[] | undefined): string {
  if (!list?.length)
    return ''
  return list
    .filter(entry => entry.enabled)
    .map(serializeEntry)
    .join(', ')
}

/** Compact one-line value shown in a collapsed shadow row. */
export function shadowSummary(entry: ShadowEntry): string {
  const kind = entry.inset ? 'Inner' : 'Outer'
  return `${kind} shadow: ${entry.x ?? 0}px ${entry.y ?? 0}px ${entry.blur ?? 0}px ${entry.spread ?? 0}px`
}

const NUMERIC_RE = /^-?(?:\d+(?:\.\d+)?|\.\d+)/

function parseShadowEntry(layer: string, index: number): ShadowEntry {
  let inset = false
  const lengths: number[] = []
  let color = ''
  for (const token of splitCssTopLevel(layer, 'space')) {
    if (token === 'inset') {
      inset = true
      continue
    }
    if (NUMERIC_RE.test(token))
      lengths.push(Number.parseFloat(token))
    else
      color = token // a color function / hex / keyword
  }
  const [x = 0, y = 0, blur = 0, spread = 0] = lengths
  // Index-based id: re-parsing the same string yields the same ids, so editing a
  // value doesn't churn list keys / collapse the open editor.
  return { id: `sh-${index}`, enabled: true, inset, x, y, blur, spread, color: color || 'rgba(0, 0, 0, 0.5)' }
}

/**
 * Parse a CSS `box-shadow` string into structured entries. Tolerant of the usual
 * `[inset] x y blur spread color` shape in any order; unparsed pieces fall back
 * to defaults. `none` / empty → no shadows.
 */
export function parseShadowString(css: string | undefined | null): ShadowEntry[] {
  const value = css?.trim()
  if (!value || value === 'none')
    return []
  return splitCssTopLevel(value, 'comma').map(parseShadowEntry)
}
