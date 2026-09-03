import type { BlockHtmlContext } from '@/core'
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
// `vue/server-renderer` rather than `@vue/server-renderer`: the latter is only
// a transitive dependency, so it is unresolvable under pnpm's strict layout in
// CI. The subpath is public and pinned to the installed `vue`'s own version.
import { renderToString } from 'vue/server-renderer'
import { defaultBlockDefinitions } from '@/blocks/registry'
import { escapeHtml } from '@/core'

/**
 * Canvas and export are two descriptions of the same block — a Vue component
 * and `renderHtml` — and nothing stops them drifting apart. They legitimately
 * differ inside (the canvas adds empty-state affordances, marker classes and
 * drop hints), but the root element they produce is the block's contract with
 * the page: change the tag or an attribute on one side only and the exported
 * page stops matching what the author saw.
 *
 * Every block component is a pure function of its props — only `computed`
 * derivations, no state or lifecycle — so `defaultProps` renders both sides
 * deterministically with nothing to mock.
 */

// Canvas-only markers, excluded from the comparison by design: `class` carries
// the `uf-*` service classes that deliberately never reach a clean export, and
// `data-uf-*` are editor hooks.
function isEditorOnly(attribute: string) {
  return attribute === 'class' || attribute.startsWith('data-uf-')
}

interface RootElement {
  tag: string
  attributes: Record<string, string>
}

// Vue re-spells the style attribute (`height:40px;` for `height: 40px`), so
// compare declarations rather than the raw string.
function normalize(attribute: string, value: string) {
  return attribute === 'style' ? value.replace(/\s+/g, '').replace(/;$/, '') : value
}

function parseRoot(markup: string): RootElement {
  // SSR prefixes a fragment with anchor comments, and template comments survive
  // into the output — neither is part of the element.
  const html = markup.replace(/<!--[\s\S]*?-->/g, '')
  const match = /^\s*<([a-z][\w-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*\/?>/i.exec(html)
  if (!match)
    throw new Error(`No root element in: ${html.slice(0, 120)}`)

  const attributes: Record<string, string> = {}
  for (const attribute of match[2]!.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) {
    const name = attribute[1]!.trim()
    if (name && !isEditorOnly(name))
      attributes[name] = normalize(name, attribute[2] ?? '')
  }
  return { tag: match[1]!.toLowerCase(), attributes }
}

const context: BlockHtmlContext = {
  classes: 'uf-test',
  escape: escapeHtml,
  untrusted: false,
  renderChildren: () => '',
}

const pairs = defaultBlockDefinitions.filter(definition =>
  definition.renderComponent && definition.renderHtml,
)

describe('canvas and export render the same root element', () => {
  it('covers every block that has both renderings', () => {
    expect(pairs.length).toBeGreaterThan(15)
  })

  it.each(pairs.map(definition => [definition.type, definition] as const))(
    '%s',
    async (type, definition) => {
      const exported = parseRoot(definition.renderHtml!(
        { id: 'b', type, props: definition.defaultProps },
        context,
      ))

      // hasChildren / hasBox suppress the canvas-only empty-state affordances,
      // leaving the markup the block would actually export. Only pass what the
      // component declares — an undeclared prop falls through as an attribute
      // and would show up as a phantom difference.
      const component = definition.renderComponent as { props?: string[] | Record<string, unknown> }
      const declared = new Set(Object.keys(
        Array.isArray(component.props)
          ? Object.fromEntries(component.props.map(name => [name, null]))
          : component.props ?? {},
      ))
      const app = createSSRApp(definition.renderComponent as never, Object.fromEntries(
        Object.entries({ props: definition.defaultProps, hasChildren: true, hasBox: true })
          .filter(([name]) => declared.has(name)),
      ))
      const canvas = parseRoot(await renderToString(app))

      expect(canvas.tag).toBe(exported.tag)
      expect(canvas.attributes).toEqual(exported.attributes)
    },
  )
})
