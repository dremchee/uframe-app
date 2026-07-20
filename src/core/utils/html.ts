import type { BlockHtmlContext, BlockRegistry } from '@/core/types/block-registry'
import type { PageBlock, PageDocument, SymbolDefinition } from '@/core/types/page-document'
import { SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core/types/page-document'
import { getInstanceSymbolId } from '@/core/utils/document-tree'
import { blockClassName, styleClassName } from '@/core/utils/styles'
import { materializeSymbolInstance } from '@/core/utils/symbols'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch] ?? ch)
}

function buildBlockClasses(block: PageBlock, extra: string[] = []): string {
  const out: string[] = [...extra]
  for (const name of block.classes ?? [])
    out.push(styleClassName(name))
  // The generated element class is emitted only when it does something —
  // carries the block's local styles. Unstyled blocks stay clean of machine
  // classes; user-facing styling hooks belong in `classes`.
  const hasLocalStyle = !!block.style && Object.keys(block.style).length > 0
  if (hasLocalStyle)
    out.push(blockClassName(block.id))
  return out.join(' ')
}

function renderUnknown(block: PageBlock, ctx: BlockHtmlContext): string {
  const inner = ctx.renderChildren()
  return `<div class="${ctx.classes}" data-uf-unknown-type="${escapeHtml(block.type)}">${inner}</div>`
}

/**
 * Collect the static `css` of every block type used in the tree — once per
 * type, in first-seen order. Symbol instances contribute their master tree's
 * types. The result is injected into the canvas iframe and the exported head so
 * block renderers can rely on classes instead of inline styles.
 */
export function collectBlockCss(
  blocks: PageBlock[],
  registry: BlockRegistry,
  symbols?: Record<string, SymbolDefinition>,
): string {
  const seenTypes = new Set<string>()
  const visitedSymbols = new Set<string>()
  const out: string[] = []

  function visit(list: PageBlock[]): void {
    for (const block of list) {
      if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
        const id = getInstanceSymbolId(block)
        const symbol = id ? symbols?.[id] : undefined
        if (symbol && id && !visitedSymbols.has(id)) {
          visitedSymbols.add(id)
          visit([symbol.root])
        }
        // Instance-owned component slot fills live under the instance so the
        // normal document walkers can see them. Their block types also need
        // static CSS even though the internal fill wrapper itself renders away.
        if (block.children?.length)
          visit(block.children)
        continue
      }
      if (!seenTypes.has(block.type)) {
        seenTypes.add(block.type)
        const css = registry[block.type]?.css
        if (css)
          out.push(css)
      }
      if (block.children?.length)
        visit(block.children)
    }
  }

  visit(blocks)
  return out.join('\n')
}

export function renderBlocksToHtml(
  blocks: PageBlock[],
  registry: BlockRegistry,
  depth = 0,
  symbols?: Record<string, SymbolDefinition>,
  ancestorSymbols: ReadonlySet<string> = new Set(),
  untrusted = false,
): string {
  const indent = '  '.repeat(depth)
  const parts: string[] = []

  for (const block of blocks) {
    if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
      // Symbol instances are inlined as their master tree at export time.
      // Editor-only wrappers (selection, hit-test) intentionally drop out.
      const id = getInstanceSymbolId(block)
      if (id && ancestorSymbols.has(id)) {
        parts.push(`${indent}<!-- circular component ${escapeHtml(id)} -->`)
        continue
      }
      const symbol = id ? symbols?.[id] : undefined
      if (!symbol) {
        parts.push(`${indent}<!-- missing component ${escapeHtml(id ?? '')} -->`)
        continue
      }
      const nextAncestors = new Set(ancestorSymbols)
      if (id)
        nextAncestors.add(id)
      const rendered = materializeSymbolInstance(block, symbol).root
      let instanceHtml = renderBlocksToHtml([rendered], registry, depth, symbols, nextAncestors, untrusted)
      // A hidden INSTANCE hides its inlined master root the same way plain
      // blocks hide — inline display:none on the opening tag.
      if (block.hidden)
        instanceHtml = instanceHtml.replace(/^(\s*<[a-z][\w:-]*)/i, `$1 style="display: none"`)
      parts.push(instanceHtml)
      continue
    }

    const definition = registry[block.type]
    const classes = buildBlockClasses(block)

    const ctx: BlockHtmlContext = {
      classes,
      escape: escapeHtml,
      untrusted,
      renderChildren: () => block.children?.length
        ? `\n${renderBlocksToHtml(block.children, registry, depth + 1, symbols, ancestorSymbols, untrusted)}\n${indent}`
        : '',
    }

    let html = definition?.renderHtml
      ? definition.renderHtml(block, ctx)
      : renderUnknown(block, ctx)

    // Renderers interpolate `${ctx.classes}` into their templates, so a block
    // with no user classes leaves `class=""` behind. Normalise the opening
    // tag's class attribute (the `[^>]` guard keeps the match inside the root
    // tag) and drop it entirely when nothing remains.
    html = html.replace(/^(\s*<[a-z][^>]*?)\s?class="([^"]*)"/i, (_, head: string, value: string) => {
      const cleaned = value.trim().replace(/\s+/g, ' ')
      return cleaned ? `${head} class="${cleaned}"` : head
    })

    // Inject the custom element id into the block's opening tag (centralised so
    // individual block renderers don't each have to handle it).
    if (block.htmlId)
      html = html.replace(/^(\s*<[a-z][\w:-]*)/i, `$1 id="${escapeHtml(block.htmlId)}"`)

    // Hidden elements ship with an inline display:none — no class is minted
    // and inline specificity beats any class/combo display value.
    if (block.hidden)
      html = html.replace(/^(\s*<[a-z][\w:-]*)/i, `$1 style="display: none"`)

    parts.push(`${indent}${html}`)
  }

  return parts.join('\n')
}

export function renderDocumentBody(document: PageDocument, registry: BlockRegistry, untrusted = false): string {
  return renderBlocksToHtml(document.blocks, registry, 0, document.symbols, new Set(), untrusted)
}
