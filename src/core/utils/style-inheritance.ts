import type { BlockStyles } from '@/core/types/block-styles'
import type { PageBlock } from '@/core/types/page-document'
import { findBlock, findBlockParentId } from '@/core/utils/block-tree'
import { classKeyApplies, isComboKey, parseClassKey } from '@/core/utils/styles'

/**
 * The style keys the editor surfaces as "inherited from a parent"
 * (Webflow-style, amber) when the selected element doesn't set them itself.
 * This is exactly the subset of BaseBlockStyles that inherits in CSS — the
 * typography set plus `cursor`. Box/layout properties (size, spacing, borders,
 * background, effects, …) do NOT inherit in CSS, so flagging them would be
 * misleading. `textDecoration` technically propagates to descendants rather
 * than inheriting, but reads the same way visually.
 */
export const INHERITED_STYLE_KEYS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'color',
  'textAlign',
  'textTransform',
  'textDecoration',
  'cursor',
] as const

export interface InheritedStyle {
  /** The inherited value, stringified for display. */
  value: string
  /** Id of the ancestor block supplying it, or `'page'` for the page style. */
  from: string
}

/**
 * A block's own effective value for one style key, base layer only: the local
 * override wins, else the combo/class that supplies it — combos built purely
 * from the block's classes first (a multi-class selector out-ranks singles),
 * then the classes in reverse application order. Mirrors the canvas cascade
 * closely enough for authored values.
 */
export function blockStyleValue(
  block: PageBlock,
  styles: Record<string, BlockStyles>,
  key: string,
): unknown {
  const local = (block.style ?? {}) as Record<string, unknown>
  if (local[key] !== undefined)
    return local[key]
  const classes = block.classes ?? []
  if (!classes.length)
    return undefined
  const candidates = [
    ...Object.keys(styles)
      .filter(name => isComboKey(name) && classKeyApplies(name, classes))
      .sort((a, b) => parseClassKey(b).length - parseClassKey(a).length),
    ...[...classes].reverse(),
  ]
  for (const name of candidates) {
    const value = (styles[name] as Record<string, unknown> | undefined)?.[key]
    if (value !== undefined)
      return value
  }
  return undefined
}

/**
 * Resolve which of `keys` the block inherits from its ancestors: walk the
 * parent chain nearest-first (the page style is the outermost ancestor) and
 * take the closest value each key finds. The block's OWN values are ignored —
 * the caller contrasts "set here" against "inherited" itself.
 *
 * Base layer only: breakpoint / state overrides on ancestors are not resolved
 * (acceptable for the panel's inherited hints; extend if they ever need to be
 * breakpoint-accurate).
 */
export function resolveInheritedStyles(
  blocks: PageBlock[],
  styles: Record<string, BlockStyles>,
  pageStyle: BlockStyles | undefined,
  blockId: string,
  keys: readonly string[] = INHERITED_STYLE_KEYS,
): Record<string, InheritedStyle> {
  const chain: PageBlock[] = []
  let parentId = findBlockParentId(blocks, blockId)
  while (parentId) {
    const parent = findBlock(blocks, parentId)
    if (!parent)
      break
    chain.push(parent)
    parentId = findBlockParentId(blocks, parent.id)
  }

  const page = (pageStyle ?? {}) as Record<string, unknown>
  const out: Record<string, InheritedStyle> = {}
  for (const key of keys) {
    for (const ancestor of chain) {
      const value = blockStyleValue(ancestor, styles, key)
      if (value !== undefined && value !== '') {
        out[key] = { value: String(value), from: ancestor.id }
        break
      }
    }
    if (!out[key] && page[key] !== undefined && page[key] !== '')
      out[key] = { value: String(page[key]), from: 'page' }
  }
  return out
}
