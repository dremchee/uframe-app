import type { BlockRegistry, PageBlock, ResolveContext, SymbolDefinition } from 'uframe/core'
import type { Component, PropType, VNode } from 'vue'
import {
  assetKey,
  DATA_ITEM_BLOCK_TYPE,
  DATA_LIST_BLOCK_TYPE,
  getInstanceSymbolId,
  materializeSymbolInstance,
  resolveBindingPath,
  styleClassName,
  SYMBOL_INSTANCE_BLOCK_TYPE,
} from 'uframe/core'
import { defineComponent, h } from 'vue'

// Recursive, component-based renderer for a published block subtree.
//
// A render function rather than a template: the work is a recursive tree walk
// with dynamic component dispatch (`registry[type].renderComponent`) and
// conditionally-built child lists (a Data List repeats its template once per
// row, in each row's data scope). A template would duplicate the same recursive
// call across the symbol / data-list / plain / fallback branches and emit stray
// comment/fragment nodes; here it's one child builder and one `h()`.
const UframeBlock = defineComponent({
  name: 'UframeBlock',
  props: {
    block: { type: Object as PropType<PageBlock>, required: true },
    registry: { type: Object as PropType<BlockRegistry>, required: true },
    symbols: Object as PropType<Record<string, SymbolDefinition>>,
    context: Object as PropType<ResolveContext>,
    scope: Object as PropType<Record<string, unknown>>,
    ancestorSymbols: Object as PropType<ReadonlySet<string>>,
    components: Object as PropType<Record<string, Component>>,
  },
  setup(props) {
    function resolveBindings(block: PageBlock, scope?: Record<string, unknown>): Record<string, unknown> | undefined {
      if (!block.bindings)
        return undefined

      const values: Record<string, unknown> = {}
      const s = { page: props.context?.page, item: scope ?? props.context?.item }
      for (const [key, path] of Object.entries(block.bindings)) {
        const value = resolveBindingPath(path, s)
        if (value !== undefined)
          values[key] = value
      }
      return Object.keys(values).length ? values : undefined
    }

    // Bound props + chosen asset src, resolved against the current scope; the
    // document is never mutated (unresolved props keep their authored value).
    function resolveProps(block: PageBlock, scope?: Record<string, unknown>): Record<string, unknown> {
      let next: Record<string, unknown> | null = null
      const bindings = resolveBindings(block, scope)
      if (bindings) {
        next = { ...block.props, ...bindings }
      }
      if (block.asset) {
        const url = props.context?.assets?.[assetKey(block.asset)] ?? props.context?.resolveAsset?.(block.asset)
        if (url) {
          next ??= { ...block.props }
          next.src = url
        }
      }
      return next ?? block.props
    }

    function classesFor(block: PageBlock): string | undefined {
      const out: string[] = []
      for (const name of block.classes ?? [])
        out.push(styleClassName(name))
      return out.filter(Boolean).join(' ') || undefined
    }

    function render(block: PageBlock, scope: Record<string, unknown> | undefined, ancestors: ReadonlySet<string>): VNode | null {
      // Symbol instance → inline its master tree (guarding against cycles).
      if (block.type === SYMBOL_INSTANCE_BLOCK_TYPE) {
        const id = getInstanceSymbolId(block)
        if (!id || ancestors.has(id))
          return null
        const symbol = props.symbols?.[id]
        if (!symbol)
          return null
        const root = materializeSymbolInstance(block, symbol, {
          propertyValues: resolveBindings(block, scope),
        }).root
        return render(root, scope, new Set(ancestors).add(id))
      }

      const def = props.registry[block.type]
      const comp = (props.components?.[block.type] ?? def?.renderComponent) as Component | undefined
      const data = props.context?.data
      const classes = classesFor(block)

      // A Data List repeats its template once per fetched row (each row its own
      // `item` scope); a Data Item renders once in its record's scope; every
      // other block passes the current scope through.
      function childVNodes(): VNode[] {
        const children = block.children ?? []
        if (block.type === DATA_LIST_BLOCK_TYPE) {
          const rows = data?.[block.id]
          if (!Array.isArray(rows))
            return []
          return rows.flatMap((row, i) =>
            children.map(c => keyed(render(c, row as Record<string, unknown>, ancestors), `${c.id}-${i}`)).filter(isVNode))
        }
        const childScope = block.type === DATA_ITEM_BLOCK_TYPE ? recordScope(data?.[block.id]) : scope
        return children.map(c => keyed(render(c, childScope, ancestors), c.id)).filter(isVNode)
      }

      if (comp) {
        return h(comp, {
          ...publicAttributes(block, classes),
          props: resolveProps(block, scope),
          // Only container blocks declare `hasChildren`; telling them they have
          // content keeps their editor "drop blocks here" placeholder from
          // rendering. Leaves don't declare it — `undefined` makes Vue omit it
          // rather than leak a stray DOM attribute.
          hasChildren: def?.acceptsChildren || undefined,
        }, { default: childVNodes })
      }
      // Unknown blocks have no renderer in the registry; preserve their
      // children rather than dropping a document subtree.
      return h('div', publicAttributes(block, classes), childVNodes())
    }

    return () => render(props.block, props.scope, props.ancestorSymbols ?? new Set())
  },
})

function publicAttributes(block: PageBlock, classes: string | undefined): { id?: string, class?: string } {
  const attributes: { id?: string, class?: string } = {}
  if (block.htmlId)
    attributes.id = block.htmlId
  if (classes)
    attributes.class = classes
  return attributes
}

function recordScope(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}
function keyed(vnode: VNode | null, key: string): VNode | null {
  if (vnode)
    vnode.key = key
  return vnode
}
function isVNode(v: VNode | null): v is VNode {
  return v != null
}

export default UframeBlock
