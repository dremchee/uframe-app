import type { BlockRegistry } from '@/core/types/block-registry'
import type { PageDocument } from '@/core/types/page-document'
import { formatCss } from '@/core/utils/css-format'
import { collectBlockCss, escapeHtml, renderDocumentBody } from '@/core/utils/html'
import { serializeDocumentStyles } from '@/core/utils/styles'

export interface RenderHtmlOptions {
  title?: string
  cssHref?: string
  lang?: string
  baseStyles?: string
  extraHead?: string
  untrustedEmbeds?: boolean
}

export function renderDocumentToHtml(
  document: PageDocument,
  registry: BlockRegistry,
  options: RenderHtmlOptions = {},
): string {
  const title = options.title ?? document.title ?? 'Untitled page'
  const lang = options.lang ?? 'en'
  const body = renderDocumentBody(document, registry, options.untrustedEmbeds)

  const head: string[] = []
  head.push('<meta charset="utf-8">')
  head.push('<meta name="viewport" content="width=device-width, initial-scale=1">')
  head.push(`<title>${escapeHtml(title)}</title>`)
  if (options.cssHref) {
    head.push(`<link rel="stylesheet" href="${escapeHtml(options.cssHref)}">`)
  }
  else {
    const blockCss = collectBlockCss(document.blocks, registry, document.symbols)
    const documentStyles = formatCss(serializeDocumentStyles(document))
    const css = [options.baseStyles, blockCss, documentStyles].filter(Boolean).join('\n')
    head.push(`<style>\n${css}\n  </style>`)
  }
  if (options.extraHead)
    head.push(options.extraHead)

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
${head.map(line => `  ${line}`).join('\n')}
</head>
<body>
${body}
</body>
</html>
`
}

/** File-name-safe slug ("Site footer" → "site-footer"). */
export function slugify(value: string, fallback = 'page'): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback
}

export interface SiteExportFile {
  name: string
  content: string
}

export function renderSiteFiles(
  documents: PageDocument[],
  registry: BlockRegistry,
  options: { baseStyles?: string, untrustedEmbeds?: boolean, extraHead?: string } = {},
): SiteExportFile[] {
  const used = new Set<string>(['index.html', 'styles.css'])
  const files = documents.map((document, index) => {
    let name = `${slugify(document.title ?? '')}.html`
    if (index === 0) {
      name = 'index.html'
    }
    else {
      for (let n = 2; used.has(name); n++)
        name = `${slugify(document.title ?? '')}-${n}.html`
      used.add(name)
    }
    return {
      name,
      content: renderDocumentToHtml(document, registry, {
        title: document.title,
        cssHref: './styles.css',
        extraHead: options.extraHead,
        untrustedEmbeds: options.untrustedEmbeds,
      }),
    }
  })

  const blocks = documents.flatMap(document => document.blocks)
  const symbols = Object.assign({}, ...documents.map(document => document.symbols ?? {})) as PageDocument['symbols']
  const styles = Object.assign({}, ...documents.map(document => document.styles ?? {})) as PageDocument['styles']
  const styleDocument: PageDocument = { ...documents[0]!, blocks, symbols, styles }
  const css = [
    options.baseStyles,
    collectBlockCss(blocks, registry, symbols),
    formatCss(serializeDocumentStyles(styleDocument)),
  ].filter(Boolean).join('\n')
  files.push({ name: 'styles.css', content: css })

  return files
}

export function renderDocumentToFragment(
  document: PageDocument,
  registry: BlockRegistry,
  options: { untrustedEmbeds?: boolean } = {},
): { html: string, css: string } {
  const blockCss = collectBlockCss(document.blocks, registry, document.symbols)
  return {
    html: renderDocumentBody(document, registry, options.untrustedEmbeds),
    css: [blockCss, formatCss(serializeDocumentStyles(document))].filter(Boolean).join('\n'),
  }
}
