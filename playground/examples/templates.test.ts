import type { PageBlock, PageDocument } from '@'
import {
  blockClassName,
  createBlockRegistry,
  defaultBlockDefinitions,
  mergeGlobalsIntoDocument,
  nameUnnamedStyles,
  parseClassKey,
  renderDocumentToHtml,
  safeParsePageDocument,
  styleClassName,
} from '@'
import { describe, expect, it } from 'vitest'
import { basicDocument } from './basic-document'
import { dynamicTemplate } from './dynamic-content'
import { starterTemplate } from './starter-template'
import { pageTemplates, stripPageGlobals, templateGlobals } from './templates'

const registry = createBlockRegistry(defaultBlockDefinitions)

// Every shipped document, in the shape the playground actually consumes:
// template pages are stripped of what templateGlobals() owns and merged back
// at render time; the standalone examples ship self-contained.
const merged: PageDocument[] = [
  ...pageTemplates.map(doc => mergeGlobalsIntoDocument(stripPageGlobals(doc), templateGlobals())),
  starterTemplate,
  basicDocument,
  dynamicTemplate,
]
const cases = merged.map(doc => [doc.title, doc] as const)

function walk(blocks: PageBlock[] | undefined, visit: (block: PageBlock) => void) {
  for (const block of blocks ?? []) {
    visit(block)
    walk(block.children, visit)
  }
}

/** Page tree + every symbol master tree. */
function allBlocks(doc: PageDocument): PageBlock[] {
  const out: PageBlock[] = []
  walk(doc.blocks, b => out.push(b))
  for (const symbol of Object.values(doc.symbols ?? {}))
    walk([symbol.root], b => out.push(b))
  return out
}

const hasStyle = (block: PageBlock) => !!block.style && Object.keys(block.style).length > 0

describe.each(cases)('template: %s', (_title, doc) => {
  it('passes the document schema', () => {
    const parsed = safeParsePageDocument(doc)
    expect(parsed.success, JSON.stringify((parsed as { error?: unknown }).error ?? '')).toBe(true)
  })

  it('has unique block ids within the page tree', () => {
    const seen = new Set<string>()
    walk(doc.blocks, (block) => {
      expect(seen.has(block.id), `duplicate id ${block.id}`).toBe(false)
      seen.add(block.id)
    })
  })

  it('references only classes that exist in the styles map', () => {
    const styles = doc.styles ?? {}
    for (const block of allBlocks(doc)) {
      for (const name of block.classes ?? [])
        expect(styles[name], `block ${block.id} references missing class "${name}"`).toBeDefined()
    }
    for (const symbol of Object.values(doc.symbols ?? {})) {
      for (const variant of symbol.variants ?? []) {
        for (const name of variant.classes)
          expect(styles[name], `variant ${variant.id} references missing class "${name}"`).toBeDefined()
      }
    }
  })

  it('uses class names that emit verbatim (no uf-cls- fallback)', () => {
    for (const key of Object.keys(doc.styles ?? {})) {
      for (const part of parseClassKey(key))
        expect(styleClassName(part), `class "${part}" would fall back to the legacy prefix`).toBe(part)
    }
  })

  it('exports clean markup: no uf-cls-, machine classes only on styled blocks', () => {
    const html = renderDocumentToHtml(doc, registry)
    expect(html).not.toContain('uf-cls-')

    const styled = new Set(allBlocks(doc).filter(hasStyle).map(b => blockClassName(b.id)))
    for (const [token] of html.matchAll(/uf-block-[\w-]+/g))
      expect(styled.has(token), `unstyled block emitted machine class ${token}`).toBe(true)
  })

  it('normalizes into fully named classes — no machine selectors survive', () => {
    // Mirrors what the editor does on load (nameLoadedStyles): after
    // normalization every block-local style lives in a named class, so the
    // export must not contain a single uf-block-* token.
    const named = nameUnnamedStyles(doc.blocks, doc.symbols, doc.styles ?? {})
    const normalized: PageDocument = { ...doc, blocks: named.blocks, symbols: named.symbols, styles: named.styles }
    expect(renderDocumentToHtml(normalized, registry)).not.toContain('uf-block-')

    const again = nameUnnamedStyles(named.blocks, named.symbols, named.styles)
    expect(again.changed).toBe(false)
  })
})
