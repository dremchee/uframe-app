import type { Component } from 'vue'
import type { BlockDefinition } from '@/core'
import { escapeHtml } from '@/core'

export type VueBlockDefinition<TProps = Record<string, unknown>> = BlockDefinition<TProps, Component>

/** A value an HTML attribute can take. */
export type AttrValue = string | number | boolean | undefined | null

// Elements that take no children and no closing tag.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

/**
 * Serializes an element for `renderHtml`.
 *
 * `undefined`, `null` and `false` drop an attribute, `true` renders it bare
 * (`required`), and every other value is escaped and quoted. An empty string is
 * kept — `name=""` is an unset form field, not an absent attribute — so pass
 * `value || undefined` where empty should mean absent.
 *
 * Children arrive as finished markup and are never escaped here: the block
 * decides between `ctx.escape(...)` for text, `ctx.renderChildren()` for a
 * subtree, and raw HTML where that is the point (Embed).
 */
export function tag(name: string, attributes: Record<string, AttrValue> = {}, children = ''): string {
  let out = `<${name}`
  for (const [attribute, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false)
      continue
    out += value === true ? ` ${attribute}` : ` ${attribute}="${escapeHtml(String(value))}"`
  }
  out += '>'
  return VOID_ELEMENTS.has(name) ? out : `${out}${children}</${name}>`
}
