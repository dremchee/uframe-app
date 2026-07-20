export interface CssUnitOption {
  /**
   * Stored selector value. Never an empty string — reka-ui forbids that for
   *  SelectItem — so the unitless ratio option uses the `UNITLESS` sentinel.
   */
  value: string
  label: string
  /** Keyword values (auto/none) stand alone with no numeric part. */
  keyword?: boolean
}

// Sentinel for the unitless option (line-height, opacity-like ratios). The CSS
// output is just the bare number; we only need a non-empty value for the Select.
export const UNITLESS = '—'

// Single source of truth for the units a length-type style field can take.
// Measurement units carry a number; the unitless option emits the bare value;
// keyword options replace the number entirely.
export const CSS_UNITS: CssUnitOption[] = [
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
  { value: 'vw', label: 'vw' },
  { value: 'vh', label: 'vh' },
  { value: 'vmin', label: 'vmin' },
  { value: 'vmax', label: 'vmax' },
  { value: 'ch', label: 'ch' },
  { value: UNITLESS, label: UNITLESS },
  { value: 'auto', label: 'auto', keyword: true },
  { value: 'none', label: 'none', keyword: true },
]

/** Full CSS dimension unit list for AdvancedSizeInput. */
export const CSS_SIZING_UNITS: CssUnitOption[] = [
  ...CSS_UNITS,
  { value: 'ex', label: 'ex' },
  { value: 'cap', label: 'cap' },
  { value: 'ic', label: 'ic' },
  { value: 'lh', label: 'lh' },
  { value: 'rlh', label: 'rlh' },
  { value: 'vi', label: 'vi' },
  { value: 'vb', label: 'vb' },
  { value: 'svw', label: 'svw' },
  { value: 'svh', label: 'svh' },
  { value: 'svi', label: 'svi' },
  { value: 'svb', label: 'svb' },
  { value: 'lvw', label: 'lvw' },
  { value: 'lvh', label: 'lvh' },
  { value: 'lvi', label: 'lvi' },
  { value: 'lvb', label: 'lvb' },
  { value: 'dvw', label: 'dvw' },
  { value: 'dvh', label: 'dvh' },
  { value: 'dvi', label: 'dvi' },
  { value: 'dvb', label: 'dvb' },
  { value: 'cqw', label: 'cqw' },
  { value: 'cqh', label: 'cqh' },
  { value: 'cqi', label: 'cqi' },
  { value: 'cqb', label: 'cqb' },
  { value: 'cqmin', label: 'cqmin' },
  { value: 'cqmax', label: 'cqmax' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'q', label: 'Q' },
  { value: 'in', label: 'in' },
  { value: 'pt', label: 'pt' },
  { value: 'pc', label: 'pc' },
]

const KEYWORDS = new Set(CSS_UNITS.filter(u => u.keyword).map(u => u.value))

export function isKeywordUnit(unit: string): boolean {
  return KEYWORDS.has(unit)
}

/** True for a complete CSS functional value, e.g. `clamp()` or `var()`. */
export function isCssExpression(value: string): boolean {
  return /^-?[a-z_][\w-]*\s*\(.+\)$/i.test(value.trim())
}

export interface ParsedLength {
  number: string
  /** A selector value from CSS_UNITS (px/%/.../UNITLESS/keyword), or '' when unknown. */
  unit: string
}

// Splits a CSS length into its numeric and unit parts. Keywords (auto/none)
// come back as { number: '', unit: keyword }; a bare number maps to the unitless
// sentinel; anything we can't parse (calc(), var()) is returned whole as `number`
// with an empty unit so the value still round-trips untouched.
export function parseLength(raw: string | number | undefined | null): ParsedLength | null {
  const s = String(raw ?? '').trim()
  if (!s)
    return null
  if (KEYWORDS.has(s))
    return { number: '', unit: s }
  const match = s.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))\s*([a-z%]*)$/i)
  if (!match)
    return { number: s, unit: '' }
  const [, number, rawUnit] = match
  return { number, unit: rawUnit ? rawUnit.toLowerCase() : UNITLESS }
}

// A plain decimal number (optionally signed) — the same grammar parseLength
// accepts. Deliberately excludes hex/octal/binary/scientific (`0x10`, `1e3`),
// which `Number()` would accept but aren't valid CSS length numbers.
const DECIMAL_RE = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/

// Whether a typed number is committable for the given unit. Empty (clears the
// value) and keyword units (auto/none, no number) are always fine; a measurement
// needs a plain decimal, and — when `min` is given — one that's not below it
// (e.g. `min: 0` rejects negative sizes / gaps). Letters or junk → false.
export function isValidLengthInput(number: string, unit: string, min?: number): boolean {
  if (isKeywordUnit(unit))
    return true
  const n = number.trim()
  if (n === '')
    return true
  if (!DECIMAL_RE.test(n))
    return false
  return min == null || Number.parseFloat(n) >= min
}

// Recombines a numeric part and a selected unit back into a CSS value.
export function formatLength(number: string, unit: string): string {
  if (isKeywordUnit(unit))
    return unit
  const n = number.trim()
  if (!n)
    return ''
  return unit === UNITLESS ? n : `${n}${unit}`
}
