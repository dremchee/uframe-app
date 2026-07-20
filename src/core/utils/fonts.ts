import type { FontConfig, FontDef } from '@/core/types/page-document'

/**
 * Curated system-font stacks — always available, never loaded (no network).
 * `value` is the exact CSS the control writes to `font-family`.
 */
export const SYSTEM_FONT_STACKS: Array<{ label: string, labelKey: string, value: string }> = [
  { label: 'System UI', labelKey: 'fontControl.systemUi', value: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { label: 'Serif', labelKey: 'fontControl.serif', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Monospace', labelKey: 'fontControl.monospace', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { label: 'Rounded', labelKey: 'fontControl.rounded', value: 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif' },
]

const SYSTEM_VALUES = new Set(SYSTEM_FONT_STACKS.map(stack => stack.value))

/** Generic fallback appended after a web family in the CSS `font-family` value. */
export function fontFamilyStack(family: string): string {
  const name = family.trim()
  if (!name)
    return ''
  const quoted = /\s/.test(name) ? `"${name}"` : name
  return `${quoted}, sans-serif`
}

/** Whether a CSS `font-family` value is one of the built-in system stacks. */
export function isSystemFontValue(value: string): boolean {
  return SYSTEM_VALUES.has(value.trim())
}

function normalizedWeights(font: FontDef): number[] {
  const list = (font.weights?.length ? font.weights : [400]).slice().sort((a, b) => a - b)
  return [...new Set(list)]
}

function wantsItalic(font: FontDef): boolean {
  return !!font.styles?.includes('italic')
}
function wantsNormal(font: FontDef): boolean {
  // Empty/undefined styles mean the default normal face.
  return !font.styles?.length || font.styles.includes('normal')
}
function collectSubsets(fonts: FontDef[]): string[] {
  return [...new Set(fonts.flatMap(font => font.subsets ?? []))]
}

// ── Provider stylesheet URLs ────────────────────────────────────────────────

// Google Fonts css2: `family=Name:ital,wght@0,400;1,700`, spaces → `+`,
// families joined by repeated `family=`, subsets via `&subset=`.
function googleHref(fonts: FontDef[]): string | null {
  const params = fonts.map((font) => {
    const family = font.family.trim().replace(/\s+/g, '+')
    const weights = normalizedWeights(font)
    const tuples: string[] = []
    if (wantsNormal(font))
      tuples.push(...weights.map(w => `0,${w}`))
    if (wantsItalic(font))
      tuples.push(...weights.map(w => `1,${w}`))
    const axis = wantsItalic(font) ? `:ital,wght@${tuples.join(';')}` : `:wght@${weights.join(';')}`
    return `family=${family}${axis}`
  })
  if (!params.length)
    return null
  const subsets = collectSubsets(fonts)
  const subset = subsets.length ? `&subset=${subsets.join(',')}` : ''
  return `https://fonts.googleapis.com/css2?${params.join('&')}${subset}&display=swap`
}

// Bunny Fonts (GDPR-friendly Google mirror): `family=name:400,700i`, family
// lowercased with spaces → `-`, families joined by `|`, subsets via `&subset=`.
function bunnyHref(fonts: FontDef[]): string | null {
  const families = fonts.map((font) => {
    const family = font.family.trim().toLowerCase().replace(/\s+/g, '-')
    const weights = normalizedWeights(font)
    const specs: string[] = []
    for (const w of weights) {
      if (wantsNormal(font))
        specs.push(`${w}`)
      if (wantsItalic(font))
        specs.push(`${w}i`)
    }
    return `${family}:${specs.join(',')}`
  })
  if (!families.length)
    return null
  const subsets = collectSubsets(fonts)
  const subset = subsets.length ? `&subset=${subsets.join(',')}` : ''
  return `https://fonts.bunny.net/css?family=${families.join('|')}${subset}&display=swap`
}

/**
 * Every stylesheet URL needed to load the registered fonts, deduped: one link
 * per web provider (Google, Bunny) plus each distinct custom URL. Local
 * (installed) fonts contribute nothing — they're already on the machine.
 */
export function fontStylesheetLinks(families: FontDef[] | undefined): string[] {
  const named = (families ?? []).filter(font => font.family.trim())
  const google = named.filter(font => font.provider === 'google')
  const bunny = named.filter(font => font.provider === 'bunny')
  const custom = [...new Set(named.filter(font => font.provider === 'custom').map(font => font.url?.trim()).filter(Boolean) as string[])]
  const links: string[] = []
  const g = googleHref(google)
  if (g)
    links.push(g)
  const b = bunnyHref(bunny)
  if (b)
    links.push(b)
  links.push(...custom)
  return links
}

/** `<head>` markup (stylesheet `<link>`s) that loads a font config's families. */
export function renderFontHead(config: FontConfig | null | undefined): string {
  return fontStylesheetLinks(config?.families)
    .map(href => `<link rel="stylesheet" href="${href.replace(/"/g, '&quot;')}">`)
    .join('\n')
}
