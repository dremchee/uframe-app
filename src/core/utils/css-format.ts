/**
 * Pretty-print serializer output for humans. The style serializers emit one
 * rule per line in compact form (`selector { a: 1; b: 2 }`) — cheap for the
 * canvas stylesheet, unreadable in an exported file or the CSS preview. This
 * reflows it with one declaration per line, nested @-rules indented, and a
 * blank line between top-level rules.
 *
 * Tokenizes on `{` / `}` / `;` only, so feed it serializer output — a CSS
 * comment would be glued to the following selector, and a `;` inside a quoted
 * string (data: URL) would split the declaration. Serialized user styles never
 * contain either (`sanitizeCssValue` strips `{};`).
 */
export function formatCss(css: string): string {
  const src = css.replace(/\s+/g, ' ').trim()
  if (!src)
    return ''
  const out: string[] = []
  const ind = (n: number) => '  '.repeat(n)
  let depth = 0
  let buf = ''
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') {
      out.push(`${ind(depth)}${buf.trim()} {`)
      buf = ''
      depth++
    }
    else if (ch === '}') {
      const decl = buf.trim()
      if (decl)
        out.push(`${ind(depth)}${decl};`)
      buf = ''
      depth--
      out.push(`${ind(depth)}}`)
      if (depth === 0)
        out.push('')
    }
    else if (ch === ';') {
      const decl = buf.trim()
      if (decl)
        out.push(`${ind(depth)}${decl};`)
      buf = ''
    }
    else {
      buf += ch
    }
  }
  while (out.length && out[out.length - 1] === '') out.pop()
  return out.join('\n')
}
