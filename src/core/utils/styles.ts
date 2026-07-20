import type { BaseBlockStyles, BlockStyles, BreakpointDef } from '@/core/types/block-styles'
import type { PageBlock, PageDocument } from '@/core/types/page-document'
import { DEFAULT_BREAKPOINTS, STYLE_STATES } from '@/core/types/block-styles'
import { visitBlockTree } from '@/core/utils/block-tree'
import { breakpointsInCascadeOrder, resolveBreakpoints } from '@/core/utils/breakpoints'
import { serializeVariables } from '@/core/utils/css-variables'
import { blockClassName, comboSelector, isComboKey, parseClassKey, styleClassName } from '@/core/utils/style-classes'
import { serializeStyleDeclarations } from '@/core/utils/style-serialization'

export {
  autoBlockClassName,
  blockClassName,
  classKeyApplies,
  comboSelector,
  isComboKey,
  nameUnnamedStyles,
  normalizeComboKey,
  normalizeSimpleClassNames,
  parseClassKey,
  sanitizeClassName,
  styleClassName,
} from '@/core/utils/style-classes'

/**
 * Apply a partial style patch to a base style object, returning a new object.
 * An empty string / null / undefined value clears (deletes) that key — the
 * shared contract the style panel controls rely on so resetting a field falls
 * back to the inherited / browser default. Pure; never mutates `base`.
 */
export function mergeStyles(base: BaseBlockStyles, patch: Partial<BaseBlockStyles>): BaseBlockStyles {
  const next: BaseBlockStyles = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value === '' || value === undefined || value === null)
      delete (next as Record<string, unknown>)[key]
    else
      (next as Record<string, unknown>)[key] = value
  }
  return next
}

type GapStyles = Pick<BaseBlockStyles, 'gap'>

/**
 * Effective gap for one axis, read from the canonical `gap` shorthand
 * (`gap: <row-gap> <column-gap>`). Any CSS length unit is preserved verbatim.
 */
export function gapAxis(styles: GapStyles | undefined, axis: 'row' | 'column'): string {
  const tokens = (styles?.gap ?? '').trim().split(/\s+/).filter(Boolean)
  if (axis === 'column')
    return tokens[1] ?? tokens[0] ?? ''
  return tokens[0] ?? ''
}

/**
 * Compose the `gap` shorthand from row/column values: nothing set → undefined
 * (clears it), equal axes → a single value, differing → `<row> <column>` (a
 * blank axis falls back to a unitless `0`). Units are kept as authored, so any
 * mix of px / rem / % / … round-trips.
 *
 * The single/two-token form doubles as the axes' LINK STATE (`gap: 12px` =
 * linked, `gap: 12px 12px` = split): pass `split: true` to keep the two-token
 * form even while the values happen to be equal, so an unlocked gap stays
 * unlocked across edits, selections and undo.
 */
export function composeGap(rowGap: string, columnGap: string, split = false): string | undefined {
  const r = rowGap.trim()
  const c = columnGap.trim()
  if (!r && !c)
    return undefined
  if (r === c && !split)
    return r
  return `${r || '0'} ${c || '0'}`
}

/**
 * Whether a gap's axes are split (unlocked): the `gap` shorthand carries two
 * tokens. The value form is the persisted lock state — see composeGap.
 */
export function isSplitGap(styles: GapStyles | undefined): boolean {
  if (!styles)
    return false
  const tokens = (styles.gap ?? '').trim().split(/\s+/).filter(Boolean)
  return tokens.length >= 2
}

function emitRulesForStyle(
  selector: string,
  styles: BlockStyles,
  breakpoints: BreakpointDef[] = DEFAULT_BREAKPOINTS,
): string[] {
  const rules: string[] = []

  const base = serializeStyleDeclarations(styles)
  if (base)
    rules.push(`${selector} { ${base} }`)

  if (styles.states) {
    for (const state of STYLE_STATES) {
      const decl = serializeStyleDeclarations(styles.states[state])
      if (decl)
        rules.push(`${selector}:${state} { ${decl} }`)
    }
  }

  if (styles.responsive) {
    // Emit in cascade order (min-width first, then max-width widest → narrowest)
    // so the winning rule lands last regardless of authoring order. Uses the
    // Media Queries Level 4 range syntax (Baseline, widely available):
    // `width >= N` / `width <= N` — the inclusive equivalents of min-/max-width.
    for (const bp of breakpointsInCascadeOrder(breakpoints)) {
      const decl = serializeStyleDeclarations(styles.responsive[bp.id])
      if (!decl)
        continue
      let query: string
      if (bp.direction === 'between' && bp.widthMax !== undefined)
        query = `(${bp.width}px <= width <= ${bp.widthMax}px)`
      else
        query = `(width ${bp.direction === 'min' ? '>=' : '<='} ${bp.width}px)`
      rules.push(`@media ${query} { ${selector} { ${decl} } }`)
    }
  }

  return rules
}

// Public form of `emitRulesForStyle` for consumers that bring their own
// selector (e.g. the CSS preview rendering `settings.style` as `body`).
export function serializeStyleRules(
  selector: string,
  styles: BlockStyles,
  breakpoints?: BreakpointDef[],
): string {
  return emitRulesForStyle(selector, styles, breakpoints).join('\n')
}

export function serializeBlockStyles(block: PageBlock, breakpoints?: BreakpointDef[]): string {
  if (!block.style)
    return ''
  return emitRulesForStyle(`.${blockClassName(block.id)}`, block.style, breakpoints).join('\n')
}

export function serializeBlockTreeStyles(
  blocks: PageBlock[],
  seen?: Set<string>,
  breakpoints?: BreakpointDef[],
): string {
  const rules: string[] = []

  visitBlockTree(blocks, (block) => {
    // Emit each block id's rule once. When a symbol is being edited its
    // root tree lives in document.blocks (with the live edits) *and* in
    // document.symbols (the stale stored copy) under identical ids — without
    // dedupe the stale copy, serialized later, would override the edit.
    if (block.style && !seen?.has(block.id))
      rules.push(...emitRulesForStyle(`.${blockClassName(block.id)}`, block.style, breakpoints))
    seen?.add(block.id)
  })
  return rules.join('\n')
}

export function serializeClassStyles(
  styles: Record<string, BlockStyles> | undefined,
  breakpoints?: BreakpointDef[],
): string {
  if (!styles)
    return ''

  // Emit single-class rules first, then combos sorted by chain length. CSS
  // specificity wins ties on its own, but source order keeps the cascade
  // readable and gives identical-specificity combos a deterministic winner.
  // Combo parts are sorted before forming the selector so equivalent keys
  // (`a.b` vs `b.a`) collapse to the same CSS selector — the editor stores
  // them normalised, but emitting consistently keeps hand-written docs sane.
  const singles: [string, BlockStyles][] = []
  const combos: [string, BlockStyles, string[]][] = []
  for (const [key, value] of Object.entries(styles)) {
    if (isComboKey(key))
      combos.push([key, value, parseClassKey(key).slice().sort()])
    else
      singles.push([key, value])
  }
  combos.sort(([, , a], [, , b]) => a.length - b.length)

  const rules: string[] = []
  for (const [name, value] of singles)
    rules.push(...emitRulesForStyle(`.${styleClassName(name)}`, value, breakpoints))
  for (const [, value, parts] of combos)
    rules.push(...emitRulesForStyle(comboSelector(parts), value, breakpoints))

  return rules.join('\n')
}

export function serializeDocumentStyles(document: PageDocument): string {
  const rules: string[] = []
  const breakpoints = resolveBreakpoints(document.settings)

  // `:root` custom properties first so every later rule can reference them.
  const rootVars = serializeVariables(document.variables)
  if (rootVars)
    rules.push(rootVars)

  // Body / page-level style first so block / class rules win specifically.
  if (document.settings.style)
    rules.push(...emitRulesForStyle('body', document.settings.style, breakpoints))

  // Class rules before block instance rules so per-block overrides win on
  // identical specificity by source order.
  const classRules = serializeClassStyles(document.styles, breakpoints)
  if (classRules)
    rules.push(classRules)

  // Shared across the page tree and symbol master trees so a block id emits
  // its rule once — document.blocks wins (it carries live edits, e.g. while
  // editing a symbol whose stored copy under document.symbols is stale).
  const seen = new Set<string>()
  const tree = serializeBlockTreeStyles(document.blocks, seen, breakpoints)
  if (tree)
    rules.push(tree)

  // Symbol master trees also live in the document — their per-block styles
  // need rules emitted, otherwise instances render without the master's
  // visual treatment.
  if (document.symbols) {
    for (const symbol of Object.values(document.symbols)) {
      const symbolTree = serializeBlockTreeStyles([symbol.root], seen, breakpoints)
      if (symbolTree)
        rules.push(symbolTree)
    }
  }

  return rules.join('\n')
}
