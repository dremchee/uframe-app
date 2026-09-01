import type { ElementTag } from '@/core'
import { ELEMENT_TAGS } from '@/core'

/**
 * Narrows a stored `tag` to a known element. Props reach the renderers from the
 * document, which a host may hand over unvalidated — interpolating an arbitrary
 * string into markup (or into Vue's `:is`) would be an injection vector.
 */
export function resolveElementTag(tag: unknown): ElementTag {
  return ELEMENT_TAGS.includes(tag as ElementTag) ? tag as ElementTag : 'div'
}
