import type { BackgroundStyles } from '@/core/types/block-styles'
import { parseGradient } from '@/core/utils/css-gradients'

/**
 * The fill kind the BackgroundPicker edits. Derived from the stored
 * `backgroundColor` / `backgroundImage` so the control reflects existing data.
 */
export type BackgroundType = 'none' | 'color' | 'image' | 'linear' | 'radial'

/** Extract the raw URL from a CSS `url(…)` background value. */
export function parseImageUrl(value: string | undefined | null): string {
  const v = value?.trim() ?? ''
  const m = /^url\((.*)\)$/is.exec(v)
  if (!m)
    return ''
  let inner = m[1].trim()
  if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith('\'') && inner.endsWith('\'')))
    inner = inner.slice(1, -1)
  return inner.trim()
}

/** Wrap a raw URL in `url("…")`; '' for an empty URL. */
export function serializeImageUrl(url: string): string {
  const u = url.trim()
  return u ? `url("${u}")` : ''
}

/** Classify the stored background into the kind the picker should display. */
export function detectBackgroundType(styles: BackgroundStyles): BackgroundType {
  const image = styles.backgroundImage?.trim()
  if (image) {
    const gradient = parseGradient(image)
    if (gradient?.type === 'linear')
      return 'linear'
    if (gradient?.type === 'radial')
      return 'radial'
    if (parseImageUrl(image))
      return 'image'
  }
  if (styles.backgroundColor?.trim())
    return 'color'
  return 'none'
}
