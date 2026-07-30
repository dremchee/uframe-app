import { converter, parse, wcagContrast } from 'culori'

export type ContrastLevel = 'aaa' | 'aa' | 'fail'

export interface ContrastResult {
  ratio: number
  level: ContrastLevel
}

const toRgb = converter('rgb')

/**
 * Calculates the WCAG 2.x contrast ratio for two CSS colors. CSS Color 4
 * syntax (including `hsl()` and `oklch()`) is parsed by Culori. A transparent
 * foreground is composited over the solid background; a transparent background
 * has no deterministic contrast without the surface behind it, so returns null.
 */
export function calculateContrast(foreground: string, background: string): ContrastResult | null {
  const fg = toRgb(parse(foreground))
  const bg = toRgb(parse(background))
  if (!fg || !bg || (bg.alpha ?? 1) < 1)
    return null

  const alpha = fg.alpha ?? 1
  const compositedForeground = alpha < 1
    ? {
        mode: 'rgb' as const,
        r: fg.r * alpha + bg.r * (1 - alpha),
        g: fg.g * alpha + bg.g * (1 - alpha),
        b: fg.b * alpha + bg.b * (1 - alpha),
      }
    : fg
  const ratio = wcagContrast(compositedForeground, bg)
  return {
    ratio,
    level: ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail',
  }
}
