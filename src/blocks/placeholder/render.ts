import type { PlaceholderBlockProps, PlaceholderKind, PlaceholderRatio } from '@/core'
import { PLACEHOLDER_KINDS, PLACEHOLDER_RATIOS } from '@/core'

// Shared by the canvas component and `renderHtml` so the two renderings can't
// drift: same classes, same inline aspect ratio. Props reach the renderers from
// the document, which a host may hand over unvalidated — narrow before use.

export function resolvePlaceholderKind(kind: unknown): PlaceholderKind {
  return PLACEHOLDER_KINDS.includes(kind as PlaceholderKind) ? kind as PlaceholderKind : 'box'
}

export function resolvePlaceholderRatio(ratio: unknown): PlaceholderRatio {
  return PLACEHOLDER_RATIOS.includes(ratio as PlaceholderRatio) ? ratio as PlaceholderRatio : 'auto'
}

export function placeholderClasses(props: PlaceholderBlockProps): string[] {
  return ['uf-placeholder', `uf-placeholder--${resolvePlaceholderKind(props.kind)}`]
}

/** CSS `aspect-ratio` value (`16 / 9`), or undefined when the box sizes to content. */
export function placeholderRatioValue(props: PlaceholderBlockProps): string | undefined {
  const ratio = resolvePlaceholderRatio(props.ratio)
  if (ratio === 'auto')
    return undefined
  const [width, height] = ratio.split(':')
  return `${width} / ${height}`
}

export function placeholderLabel(props: PlaceholderBlockProps): string {
  return props.label?.trim() ?? ''
}
