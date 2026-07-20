import type { BlockStyles } from '@/core/types/block-styles'
import type { PageBlock, SymbolDefinition } from '@/core/types/page-document'
import { createUniqueName } from '@/core/utils/ids'

const RESERVED_CLASS_PREFIX = 'uf-'
const GENERATED_ID_RE = /_[0-9a-f]{8}$/i
const UUIDISH_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function blockClassName(id: string): string {
  return `uf-block-${id.replace(/[^\w-]/g, '_')}`
}

/** Validates user-authored class names stored in `document.styles`. */
export function sanitizeClassName(raw: string): string {
  const name = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
  if (!/^[a-z_]/.test(name) || name.startsWith(RESERVED_CLASS_PREFIX))
    return ''
  return name
}

/** Produces the stable class actually emitted for a document style entry. */
export function styleClassName(name: string): string {
  const cleaned = name.replace(/[^\w-]/g, '_')
  if (/^[a-z_][\w-]*$/i.test(cleaned) && !cleaned.toLowerCase().startsWith(RESERVED_CLASS_PREFIX))
    return cleaned
  return `uf-cls-${cleaned}`
}

/** Chooses a human-readable base name when extracting a local block style. */
export function autoBlockClassName(block: Pick<PageBlock, 'id' | 'type'>): string {
  const isGenerated = GENERATED_ID_RE.test(block.id) || UUIDISH_RE.test(block.id)
  if (!isGenerated) {
    const fromId = sanitizeClassName(block.id)
    if (fromId)
      return fromId
  }
  return sanitizeClassName(block.type) || 'element'
}

export interface NamedStylesResult {
  blocks: PageBlock[]
  symbols: Record<string, SymbolDefinition> | undefined
  styles: Record<string, BlockStyles>
  changed: boolean
}

/** Lifts each local block style into a unique named class without cloning untouched nodes. */
export function nameUnnamedStyles(
  blocks: PageBlock[],
  symbols: Record<string, SymbolDefinition> | undefined,
  styles: Record<string, BlockStyles>,
  reserved?: Record<string, BlockStyles>,
): NamedStylesResult {
  const nextStyles = { ...styles }
  let changed = false

  function visit(block: PageBlock): PageBlock {
    const children = block.children?.map(visit)
    const childrenChanged = !!children && children.some((child, index) => child !== block.children![index])
    const hasLocalStyle = !!block.style && Object.keys(block.style).length > 0
    if (!hasLocalStyle)
      return childrenChanged ? { ...block, children } : block

    const name = createUniqueName(autoBlockClassName(block), [...Object.keys(nextStyles), ...Object.keys(reserved ?? {})])
    nextStyles[name] = { ...block.style! }
    changed = true
    const { style: _style, ...rest } = block
    return {
      ...rest,
      ...(children ? { children } : {}),
      classes: [...(block.classes ?? []), name],
    }
  }

  const nextBlocks = blocks.map(visit)
  let nextSymbols = symbols
  if (symbols) {
    const entries = Object.entries(symbols).map(([id, symbol]) => {
      const root = visit(symbol.root)
      return [id, root === symbol.root ? symbol : { ...symbol, root }] as const
    })
    if (entries.some(([id, symbol]) => symbol !== symbols[id]))
      nextSymbols = Object.fromEntries(entries)
  }

  return { blocks: nextBlocks, symbols: nextSymbols, styles: nextStyles, changed }
}

export function parseClassKey(key: string): string[] {
  return key.split('.').filter(Boolean)
}

/** Whether every selector part in a class key exists on a block's class set. */
export function classKeyApplies(key: string, classes: Iterable<string>): boolean {
  const classSet = classes instanceof Set ? classes : new Set(classes)
  return parseClassKey(key).every(part => classSet.has(part))
}

export function isComboKey(key: string): boolean {
  return key.includes('.')
}

/** Normalizes order-insensitive combo keys for stable style-map storage. */
export function normalizeComboKey(parts: string[]): string {
  return Array.from(new Set(parts.filter(Boolean))).sort().join('.')
}

/** Keeps only unique simple class names, preserving the authoring order. */
export function normalizeSimpleClassNames(classes: Iterable<string>): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const className of classes) {
    if (!className || isComboKey(className) || seen.has(className))
      continue
    seen.add(className)
    normalized.push(className)
  }
  return normalized
}

export function comboSelector(parts: string[]): string {
  return parts.map(part => `.${styleClassName(part)}`).join('')
}
