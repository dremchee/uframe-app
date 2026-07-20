import type * as CSS from 'csstype'

// Plugin-authoring helpers for bridging CSS strings and style objects.
// `uframe`'s renderHtml / style utilities produce inline CSS strings; component
// authors (React/JSX and friends) often need the same value as a style object.

// Style-object shape: standard properties (camelCased) plus CSS custom
// properties. Compatible with React's `CSSProperties`, so the result of
// `cssToObject` drops straight into a `style` prop without a cast.
export type StyleObject = CSS.Properties<string | number> & Record<`--${string}`, string | number>

/** Reads the numeric pixel part of a resolved CSS value, falling back safely. */
export function parseCssPixels(value: string | undefined | null, fallback = 0): number {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Removes characters that could escape a CSS declaration or stylesheet. */
export function sanitizeCssValue(value: string): string {
  return value.replace(/[<>{};]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Parse an inline CSS declaration string (`'color:red; margin:0'`) into a
 * camelCased style object suitable for a framework `style` prop.
 *
 * - Splits on the first `:` per declaration, so values containing colons
 *   (`url(data:…)`, `var(--x, #fff)`) survive intact.
 * - Custom properties (`--foo`) keep their name as-is (valid React style keys);
 *   regular props are camelCased (`background-color` → `backgroundColor`).
 */
export function cssToObject(css: string): StyleObject {
  const out: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1)
      continue
    const prop = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    if (!prop || !value)
      continue
    const key = prop.startsWith('--')
      ? prop
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    out[key] = value
  }
  return out as StyleObject
}

/**
 * Serialize a camelCased style object back into an inline CSS string. Inverse of
 * {@link cssToObject}; custom properties (`--foo`) are emitted verbatim.
 */
export function objectToCss(style: Partial<StyleObject>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(style)) {
    if (value === '' || value == null)
      continue
    const prop = key.startsWith('--')
      ? key
      : key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
    parts.push(`${prop}:${value}`)
  }
  return parts.join(';')
}
