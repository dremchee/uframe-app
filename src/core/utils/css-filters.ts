import type { FilterEntry, FilterFnType } from '@/core/types/block-styles'
import { createUniqueId } from '@/core/utils/ids'

/** The unit a single-argument filter's `amount` is expressed in. */
export type FilterUnit = 'px' | '%' | 'deg'

export interface FilterFnMeta {
  type: FilterFnType
  /** Human label shown in the picker and row summary. */
  label: string
  /** `drop-shadow` is composite; every other type is a single `amount`. */
  composite: boolean
  /** Unit + slider bounds for single-argument filters. */
  unit?: FilterUnit
  min?: number
  max?: number
  step?: number
  /** The value a freshly added filter starts with (mirrors the design mocks). */
  defaultAmount?: number
}

/**
 * Registry driving the picker, per-type editor controls, defaults and
 * serialization. The default amounts intentionally produce a visible effect so a
 * just-added filter shows immediately on the canvas.
 */
export const FILTER_FN_META: Record<FilterFnType, FilterFnMeta> = {
  'blur': { type: 'blur', label: 'Blur', composite: false, unit: 'px', min: 0, max: 100, step: 1, defaultAmount: 5 },
  'brightness': { type: 'brightness', label: 'Brightness', composite: false, unit: '%', min: 0, max: 300, step: 1, defaultAmount: 200 },
  'contrast': { type: 'contrast', label: 'Contrast', composite: false, unit: '%', min: 0, max: 300, step: 1, defaultAmount: 200 },
  'saturate': { type: 'saturate', label: 'Saturate', composite: false, unit: '%', min: 0, max: 300, step: 1, defaultAmount: 200 },
  'grayscale': { type: 'grayscale', label: 'Grayscale', composite: false, unit: '%', min: 0, max: 100, step: 1, defaultAmount: 100 },
  'invert': { type: 'invert', label: 'Invert', composite: false, unit: '%', min: 0, max: 100, step: 1, defaultAmount: 100 },
  'sepia': { type: 'sepia', label: 'Sepia', composite: false, unit: '%', min: 0, max: 100, step: 1, defaultAmount: 100 },
  'opacity': { type: 'opacity', label: 'Opacity', composite: false, unit: '%', min: 0, max: 100, step: 1, defaultAmount: 50 },
  'hue-rotate': { type: 'hue-rotate', label: 'Hue rotate', composite: false, unit: 'deg', min: 0, max: 360, step: 1, defaultAmount: 180 },
  'drop-shadow': { type: 'drop-shadow', label: 'Drop shadow', composite: true },
}

/** Picker order — matches the design mocks (drop-shadow sits with the rest). */
export const FILTER_FN_TYPES: FilterFnType[] = [
  'blur',
  'saturate',
  'drop-shadow',
  'grayscale',
  'brightness',
  'invert',
  'contrast',
  'sepia',
  'hue-rotate',
  'opacity',
]

/** A new, enabled filter of `type`, pre-filled with its default values. */
export function defaultFilter(type: FilterFnType): FilterEntry {
  const meta = FILTER_FN_META[type]
  if (meta.composite)
    return { id: createUniqueId('flt'), type, enabled: true, x: 0, y: 2, blur: 5, color: 'rgba(0, 0, 0, 0.7)' }
  return { id: createUniqueId('flt'), type, enabled: true, amount: meta.defaultAmount }
}

function serializeEntry(entry: FilterEntry): string {
  if (entry.type === 'drop-shadow') {
    const x = entry.x ?? 0
    const y = entry.y ?? 0
    const blur = entry.blur ?? 0
    const color = entry.color || 'rgba(0, 0, 0, 0.5)'
    return `drop-shadow(${x}px ${y}px ${blur}px ${color})`
  }
  const meta = FILTER_FN_META[entry.type]
  const amount = entry.amount ?? 0
  return `${entry.type}(${amount}${meta.unit ?? ''})`
}

/**
 * Join the enabled entries into a CSS `filter` / `backdrop-filter` value, in
 * list order. Returns '' when there's nothing enabled to render.
 */
export function serializeFilters(list: FilterEntry[] | undefined): string {
  if (!list?.length)
    return ''
  return list
    .filter(entry => entry.enabled)
    .map(serializeEntry)
    .join(' ')
}

/** Compact one-line value shown in a collapsed filter row (e.g. "Blur: 5px"). */
export function filterSummary(entry: FilterEntry): string {
  const meta = FILTER_FN_META[entry.type]
  if (entry.type === 'drop-shadow')
    return `${meta.label}: ${entry.x ?? 0}px ${entry.y ?? 0}px ${entry.blur ?? 0}px`
  return `${meta.label}: ${entry.amount ?? 0}${meta.unit ?? ''}`
}
