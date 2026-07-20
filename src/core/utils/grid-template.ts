/**
 * Parse / serialize a CSS grid track list (`grid-template-columns` /
 * `grid-template-rows`). The document stores the plain CSS string; the editor
 * works with an array of tracks so columns/rows can be added, removed and
 * resized individually. Pure — no Vue, unit-tested.
 */

export interface GridTrack {
  /** A single track sizing function, e.g. `1fr`, `200px`, `auto`, `minmax(100px, 1fr)`. */
  size: string
}

/** CSS units the canvas can preserve while resizing resolved grid geometry. */
export type GridTrackUnit = 'px' | 'fr' | 'pct' | 'rem' | 'em' | null

/** Resolved dimensions used to convert between CSS grid units and pixels. */
export interface GridUnitContext {
  frRatio?: number
  pctBase: number
  fontSize: number
  rootFontSize: number
}

/** Classifies the simple units the canvas can safely round-trip while dragging. */
export function gridTrackUnit(size: string): GridTrackUnit {
  if (/^-?[\d.]+px$/.test(size))
    return 'px'
  if (/^-?[\d.]+fr$/.test(size))
    return 'fr'
  if (/^-?[\d.]+%$/.test(size))
    return 'pct'
  if (/^-?[\d.]+rem$/.test(size))
    return 'rem'
  if (/^-?[\d.]+em$/.test(size))
    return 'em'
  return null
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundTo = (value: number, step: number) => Number((Math.round(value / step) * step).toFixed(4))
const formatPx = (value: number, min: number, max: number) => `${clamp(Math.round(value), min, max)}px`

/** Converts a resolved pixel track size back to its authored CSS unit. */
export function formatGridTrackSize(px: number, unit: GridTrackUnit, context: GridUnitContext): string {
  switch (unit) {
    case 'fr':
      return context.frRatio && context.frRatio > 0
        ? `${clamp(roundTo(px / context.frRatio, 0.1), 0.1, 24)}fr`
        : formatPx(px, 8, 4000)
    case 'pct':
      return context.pctBase > 0
        ? `${clamp(Math.round(px / context.pctBase * 100), 1, 100)}%`
        : formatPx(px, 8, 4000)
    case 'rem':
      return `${clamp(roundTo(px / context.rootFontSize, 0.25), 0.25, 200)}rem`
    case 'em':
      return `${clamp(roundTo(px / context.fontSize, 0.25), 0.25, 200)}em`
    default:
      return formatPx(px, 8, 4000)
  }
}

/** Converts a resolved pixel gap size back to its authored CSS unit. */
export function formatGridGapSize(px: number, unit: GridTrackUnit, context: GridUnitContext): string {
  const value = Math.max(0, px)
  switch (unit) {
    case 'rem':
      return `${clamp(roundTo(value / context.rootFontSize, 0.25), 0, 40)}rem`
    case 'em':
      return `${clamp(roundTo(value / context.fontSize, 0.25), 0, 40)}em`
    case 'pct':
      return context.pctBase > 0
        ? `${clamp(roundTo(value / context.pctBase * 100, 0.1), 0, 100)}%`
        : formatPx(value, 0, 400)
    default:
      return formatPx(value, 0, 400)
  }
}

/**
 * Splits a track list into individual tracks on top-level whitespace, keeping
 * parenthesised functions (`minmax(...)`, `repeat(...)`) intact. Returns `[]`
 * for empty / `none`. Line-name brackets (`[name]`) are not split out — they
 * stay attached to the following token (advanced, rarely used in the editor).
 */
export function parseTrackList(value: string | undefined | null): GridTrack[] {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === 'none')
    return []

  const tracks: GridTrack[] = []
  let depth = 0
  let token = ''
  for (const ch of trimmed) {
    if (ch === '(')
      depth++
    else if (ch === ')')
      depth = Math.max(0, depth - 1)

    if (/\s/.test(ch) && depth === 0) {
      if (token) {
        tracks.push({ size: token })
        token = ''
      }
    }
    else {
      token += ch
    }
  }
  if (token)
    tracks.push({ size: token })
  return tracks
}

/** Joins tracks back into a CSS string; drops blank tracks. `''` when empty. */
export function serializeTrackList(tracks: GridTrack[]): string {
  return tracks
    .map(t => t.size.trim())
    .filter(Boolean)
    .join(' ')
}

/** Builds N equal tracks of the given size (default `1fr`) for quick presets. */
export function makeEqualTracks(count: number, size = '1fr'): GridTrack[] {
  return Array.from({ length: Math.max(0, count) }, () => ({ size }))
}

// ── repeat() templates ─────────────────────────────────────────────────────
// The common "responsive cards" pattern `repeat(auto-fit, minmax(<min>, <max>))`
// isn't an explicit track list — it's a single auto-repeat. The editor models it
// as a distinct mode so `min` / `max` / the repeat kind can be edited as fields
// instead of being crammed into one opaque track.

export interface AutoRepeatTemplate {
  mode: 'auto'
  repeat: 'auto-fit' | 'auto-fill'
  min: string
  max: string
}

/** A fixed-count `repeat(<count>, <track-list>)` template. */
export interface FixedRepeatTemplate {
  mode: 'repeat'
  count: number
  pattern: string
}

export interface TracksTemplate {
  mode: 'tracks'
  tracks: GridTrack[]
}

export type GridTemplate = AutoRepeatTemplate | FixedRepeatTemplate | TracksTemplate

// `repeat( auto-fit | auto-fill , minmax( <min> , <max> ) )` — whitespace-tolerant.
// Capture groups use distinct terminators (`,` / `)`) and no lazy quantifiers,
// so there's no super-linear backtracking; surrounding spaces are trimmed below.
const AUTO_REPEAT_RE = /^repeat\(\s*(auto-fit|auto-fill)\s*,\s*minmax\(([^,]+),([^)]+)\)\s*\)\s*$/i
const FIXED_REPEAT_PREFIX_RE = /^repeat\(\s*([1-9]\d*)\s*,/i

/**
 * Parse a `grid-template-*` value into either an auto-repeat descriptor (when it
 * matches a supported `repeat()` shape) or an explicit track list. Fixed
 * repeats preserve their inner track list verbatim, so compound patterns such
 * as `minmax(0, 1fr)` remain editable.
 */
export function parseGridTemplate(value: string | undefined | null): GridTemplate {
  const trimmed = value?.trim() ?? ''
  const match = AUTO_REPEAT_RE.exec(trimmed)
  if (match) {
    return {
      mode: 'auto',
      repeat: match[1].toLowerCase() as 'auto-fit' | 'auto-fill',
      min: match[2].trim(),
      max: match[3].trim(),
    }
  }
  const fixedMatch = FIXED_REPEAT_PREFIX_RE.exec(trimmed)
  if (fixedMatch && trimmed.endsWith(')')) {
    const pattern = trimmed.slice(fixedMatch[0].length, -1).trim()
    if (pattern) {
      return {
        mode: 'repeat',
        count: Number(fixedMatch[1]),
        pattern,
      }
    }
  }
  return { mode: 'tracks', tracks: parseTrackList(value) }
}

/** Serialize a GridTemplate back to a CSS string. `''` when empty (tracks mode). */
export function serializeGridTemplate(template: GridTemplate): string {
  if (template.mode === 'auto') {
    const min = template.min.trim() || '240px'
    const max = template.max.trim() || '1fr'
    return `repeat(${template.repeat}, minmax(${min}, ${max}))`
  }
  if (template.mode === 'repeat') {
    const count = Number.isInteger(template.count) && template.count > 0 ? template.count : 2
    const pattern = template.pattern.trim() || '1fr'
    return `repeat(${count}, ${pattern})`
  }
  return serializeTrackList(template.tracks)
}

/**
 * Splitter resize (à la grid.layoutit.com): dragging the boundary between track
 * `index` and `index + 1` by `deltaPx` grows one track and shrinks the other by
 * the same amount, so the rest of the grid stays put. The delta is clamped so
 * neither of the two adjacent tracks drops below `minPx`. Returns the new px
 * size for each side. Pure — the caller converts px back into each track's unit.
 */
export function resizeAdjacentTracks(
  sizesPx: number[],
  index: number,
  deltaPx: number,
  minPx: number,
): { aPx: number, bPx: number } {
  const aStart = sizesPx[index]
  const bStart = sizesPx[index + 1]
  // If the pair is too small to keep both at `minPx`, relax the floor to half
  // their combined size so the clamp bounds don't cross and produce a negative.
  const min = Math.min(minPx, (aStart + bStart) / 2)
  const delta = Math.min(bStart - min, Math.max(min - aStart, deltaPx))
  return { aPx: aStart + delta, bPx: bStart - delta }
}
