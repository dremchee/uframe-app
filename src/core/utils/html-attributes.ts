import type { HtmlAttributes, PageBlock } from '@/core/types/page-document'

export type HtmlAttributeNameError
  = | 'empty'
    | 'invalid'
    | 'reserved'
    | 'event-handler'

// These names are owned by the editor/renderer contract rather than the
// rendered HTML element. Letting them through would either bypass the style
// system or be consumed as Vue component props before reaching the DOM.
const RESERVED_ATTRIBUTE_NAMES = new Set([
  'class',
  'style',
  'key',
  'ref',
  'props',
  'has-children',
  'has-box',
  'slot-fallback-label',
  'select-option-fallback-label',
])

// HTML only forbids whitespace, control characters and a small set of
// delimiters in attribute names. Colons remain valid for namespaced/custom
// attributes; data-* and aria-* naturally pass this rule.
const ATTRIBUTE_NAME_DELIMITERS = new Set(['"', '\'', '/', '>', '='])

function isValidHtmlAttributeName(name: string): boolean {
  return [...name].every((character) => {
    const code = character.charCodeAt(0)
    return code > 0x20
      && !(code >= 0x7F && code <= 0x9F)
      && !ATTRIBUTE_NAME_DELIMITERS.has(character)
  })
}

export function normalizeHtmlAttributeName(value: string): string {
  return value.trim().toLowerCase()
}

export function htmlAttributeNameError(value: string): HtmlAttributeNameError | null {
  const name = normalizeHtmlAttributeName(value)
  if (!name)
    return 'empty'
  if (!isValidHtmlAttributeName(name))
    return 'invalid'
  if (/^on/i.test(name))
    return 'event-handler'
  if (RESERVED_ATTRIBUTE_NAMES.has(name))
    return 'reserved'
  return null
}

export function normalizeHtmlAttributes(attributes?: HtmlAttributes): HtmlAttributes {
  if (!attributes)
    return {}

  const normalized: HtmlAttributes = {}
  for (const [rawName, rawValue] of Object.entries(attributes)) {
    const name = normalizeHtmlAttributeName(rawName)
    if (htmlAttributeNameError(name))
      continue
    normalized[name] = String(rawValue)
  }
  return normalized
}

/**
 * Return the safe attributes rendered on a block's root element.
 *
 * `htmlId` predates the generic attribute map. It remains readable for old
 * documents and public API callers, while a value in `attributes.id` wins when
 * both are present.
 */
export function resolveBlockHtmlAttributes(
  block: Pick<PageBlock, 'attributes' | 'htmlId'>,
): HtmlAttributes {
  return normalizeHtmlAttributes({
    ...(block.htmlId ? { id: block.htmlId } : {}),
    ...(block.attributes ?? {}),
  })
}
