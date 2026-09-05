import type { BaseBlockStyles } from '@/core/types/block-styles'
import { parseGridTemplate, parseTrackList } from '@/core/utils/grid-template'
import { mergeStyles } from '@/core/utils/styles'

/**
 * Pure mappings behind the Quick layout controls. They translate a handful of
 * prototyping-oriented choices (stack direction, column count, an alignment
 * cell, one padding value, a width mode) into ordinary style keys and back, so
 * the controls stay a thin view over the same styles the full Style panel
 * edits. Values are written explicitly (`display: block`, `width: auto`) rather
 * than cleared: a breakpoint slice can only override what it stores, and a
 * cleared key would silently keep the inherited value there.
 */

export type LayoutMode = 'block' | 'column' | 'row' | 'grid'

/** Style keys the quick controls read or write — for the section's "modified" marker. */
export const QUICK_LAYOUT_KEYS = [
  'display',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'justifyItems',
  'gap',
  'gridTemplateColumns',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'width',
] as const satisfies ReadonlyArray<keyof BaseBlockStyles>

export const DEFAULT_GRID_COLUMN_PATTERN = 'minmax(0, 1fr)'
export const DEFAULT_GRID_COLUMN_COUNT = 2

export function resolveLayoutMode(styles: BaseBlockStyles): LayoutMode {
  const display = styles.display
  if (display === 'grid')
    return 'grid'
  if (display === 'flex' || display === 'inline-flex') {
    const direction = styles.flexDirection
    return direction === 'column' || direction === 'column-reverse' ? 'column' : 'row'
  }
  return 'block'
}

export function applyLayoutMode(styles: BaseBlockStyles, mode: LayoutMode): BaseBlockStyles {
  switch (mode) {
    case 'block':
      return mergeStyles(styles, { display: 'block' })
    case 'column':
      return mergeStyles(styles, { display: 'flex', flexDirection: 'column' })
    case 'row':
      return mergeStyles(styles, { display: 'flex', flexDirection: 'row' })
    case 'grid':
      return mergeStyles(styles, {
        display: 'grid',
        gridTemplateColumns: styles.gridTemplateColumns
          || `repeat(${DEFAULT_GRID_COLUMN_COUNT}, ${DEFAULT_GRID_COLUMN_PATTERN})`,
      })
  }
}

/**
 * Column count of a uniform template — `repeat(N, <track>)` or N identical
 * explicit tracks. An empty template is the implicit single column. `null`
 * when the tracks differ, which the quick control shows as "custom".
 */
export function resolveGridColumnCount(styles: BaseBlockStyles): number | null {
  const template = parseGridTemplate(styles.gridTemplateColumns)
  if (template.mode === 'repeat')
    return parseTrackList(template.pattern).length === 1 ? template.count : null
  if (template.mode !== 'tracks')
    return null
  if (!template.tracks.length)
    return 1
  const sizes = new Set(template.tracks.map(track => track.size))
  return sizes.size === 1 ? template.tracks.length : null
}

/** The single track a uniform template repeats; the default pattern otherwise. */
function gridColumnPattern(styles: BaseBlockStyles): string {
  const template = parseGridTemplate(styles.gridTemplateColumns)
  if (template.mode === 'repeat' && parseTrackList(template.pattern).length === 1)
    return template.pattern
  if (template.mode === 'tracks' && template.tracks.length && new Set(template.tracks.map(track => track.size)).size === 1)
    return template.tracks[0]!.size
  return DEFAULT_GRID_COLUMN_PATTERN
}

export function withGridColumnCount(styles: BaseBlockStyles, count: number): BaseBlockStyles {
  const clamped = Math.min(24, Math.max(1, Math.round(count)))
  return mergeStyles(styles, { gridTemplateColumns: `repeat(${clamped}, ${gridColumnPattern(styles)})` })
}

// ── Alignment ──────────────────────────────────────────────────────────────

export type AlignValue = 'start' | 'center' | 'end'

export interface QuickAlignment {
  /** Position along the page's horizontal axis, whichever style key carries it. */
  horizontal: AlignValue | null
  /** Position along the vertical axis. */
  vertical: AlignValue | null
  /** `justify-content` is a space-* distribution (flex only). */
  distributed: boolean
}

const TO_ALIGN: Record<string, AlignValue> = {
  'start': 'start',
  'flex-start': 'start',
  'center': 'center',
  'end': 'end',
  'flex-end': 'end',
}

const TO_FLEX = { start: 'flex-start', center: 'center', end: 'flex-end' } as const

function toAlign(value: string | undefined): AlignValue | null {
  return value ? TO_ALIGN[value] ?? null : null
}

function reverseAlign(value: AlignValue | null): AlignValue | null {
  return value === 'start' ? 'end' : value === 'end' ? 'start' : value
}

function isReverse(styles: BaseBlockStyles, mode: LayoutMode): boolean {
  return styles.flexDirection === `${mode}-reverse`
}

/**
 * Reads the alignment cell for the current mode. A flex row justifies along X
 * and aligns items along Y; a column swaps the two; a grid aligns its items
 * with `justify-items` / `align-items`.
 */
export function resolveAlignment(styles: BaseBlockStyles, mode: LayoutMode): QuickAlignment {
  const justify = styles.justifyContent
  // Logical start/end do not reverse; flex-start/flex-end follow flex direction.
  const main = isReverse(styles, mode) && (justify === 'flex-start' || justify === 'flex-end')
    ? reverseAlign(toAlign(justify))
    : toAlign(justify)
  const distributed = justify === 'space-between' || justify === 'space-around' || justify === 'space-evenly'
  switch (mode) {
    case 'row':
      return { horizontal: main, vertical: toAlign(styles.alignItems), distributed }
    case 'column':
      return { horizontal: toAlign(styles.alignItems), vertical: main, distributed }
    case 'grid':
      return { horizontal: toAlign(styles.justifyItems), vertical: toAlign(styles.alignItems), distributed: false }
    default:
      return { horizontal: null, vertical: null, distributed: false }
  }
}

export function applyAlignment(
  styles: BaseBlockStyles,
  mode: LayoutMode,
  horizontal: AlignValue,
  vertical: AlignValue,
): BaseBlockStyles {
  switch (mode) {
    case 'row':
      return mergeStyles(styles, { justifyContent: TO_FLEX[isReverse(styles, mode) ? reverseAlign(horizontal)! : horizontal], alignItems: TO_FLEX[vertical] })
    case 'column':
      return mergeStyles(styles, { alignItems: TO_FLEX[horizontal], justifyContent: TO_FLEX[isReverse(styles, mode) ? reverseAlign(vertical)! : vertical] })
    case 'grid':
      return mergeStyles(styles, { justifyItems: horizontal, alignItems: TO_FLEX[vertical] })
    default:
      return styles
  }
}

/** Flex only: toggles `justify-content: space-between` along the main axis. */
export function toggleDistribution(styles: BaseBlockStyles, mode: LayoutMode): BaseBlockStyles {
  if (mode !== 'row' && mode !== 'column')
    return styles
  const on = resolveAlignment(styles, mode).distributed
  return mergeStyles(styles, { justifyContent: on ? 'flex-start' : 'space-between' })
}

// ── Padding ────────────────────────────────────────────────────────────────

const PADDING_KEYS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const

export type UniformPadding = { kind: 'uniform', value: string } | { kind: 'mixed' }

/** One value when all four sides agree (all unset counts as `''`), else mixed. */
export function resolveUniformPadding(styles: BaseBlockStyles): UniformPadding {
  const values = PADDING_KEYS.map(key => styles[key] ?? '')
  return values.every(value => value === values[0])
    ? { kind: 'uniform', value: values[0]! }
    : { kind: 'mixed' }
}

export function withUniformPadding(styles: BaseBlockStyles, value: string): BaseBlockStyles {
  return mergeStyles(styles, {
    paddingTop: value,
    paddingRight: value,
    paddingBottom: value,
    paddingLeft: value,
  })
}

// ── Width ──────────────────────────────────────────────────────────────────

export type WidthMode = 'auto' | 'fill' | 'hug' | 'fixed'

export const DEFAULT_FIXED_WIDTH = '320px'

export function resolveWidthMode(styles: BaseBlockStyles): WidthMode {
  const width = styles.width?.trim()
  if (!width || width === 'auto')
    return 'auto'
  if (width === '100%')
    return 'fill'
  if (width === 'fit-content' || width === 'max-content' || width === 'min-content')
    return 'hug'
  return 'fixed'
}

/** `fixed` keeps an existing explicit width and only seeds a default when there is none. */
export function applyWidthMode(styles: BaseBlockStyles, mode: WidthMode): BaseBlockStyles {
  switch (mode) {
    case 'auto':
      return mergeStyles(styles, { width: 'auto' })
    case 'fill':
      return mergeStyles(styles, { width: '100%' })
    case 'hug':
      return mergeStyles(styles, { width: 'fit-content' })
    case 'fixed':
      return resolveWidthMode(styles) === 'fixed' ? styles : mergeStyles(styles, { width: DEFAULT_FIXED_WIDTH })
  }
}
