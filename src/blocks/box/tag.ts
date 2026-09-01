import type { BoxTag } from '@/core'
import { BOX_TAGS } from '@/core'

/**
 * Narrows a stored `tag` to a known element. Props reach the renderers from the
 * document, which a host may hand over unvalidated — interpolating an arbitrary
 * string into markup (or into Vue's `:is`) would be an injection vector.
 */
export function resolveBoxTag(tag: unknown): BoxTag {
  return BOX_TAGS.includes(tag as BoxTag) ? tag as BoxTag : 'div'
}
