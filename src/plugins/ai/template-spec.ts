import type { BlockRegistry, BlockStyles, PageBlock } from '@/core'
import { z } from 'zod'
import { blockStylesSchema, createBlock, validateBlockProps } from '@/core'

// The shape the model emits — a deliberately simplified block tree (no ids, no
// document chrome). We turn it into real `PageBlock`s via the core primitives so
// ids, default props, and validation are handled the same way as manual edits.
export interface AiBlockSpec {
  type: string
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  classes?: string[]
  children?: AiBlockSpec[]
}

const aiBlockSchema: z.ZodType<AiBlockSpec> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    classes: z.array(z.string()).optional(),
    children: z.array(aiBlockSchema).optional(),
  }),
)

/** Top-level response: a list of blocks plus an optional one-line note for chat. */
export const aiTemplateSchema = z.object({
  blocks: z.array(aiBlockSchema),
  note: z.string().optional(),
})

export interface BuildResult {
  blocks: PageBlock[]
  /** Human-readable notes about repairs (unknown types, invalid props/styles). */
  warnings: string[]
}

// Coerce a model-supplied style map to a valid `BlockStyles`, dropping keys the
// schema rejects (the AI sends CSS-ish strings; the schema knows the real shape).
function coerceStyle(style: Record<string, unknown> | undefined, warnings: string[], type: string): BlockStyles | undefined {
  if (!style || !Object.keys(style).length)
    return undefined
  const parsed = blockStylesSchema.safeParse(style)
  if (parsed.success)
    return parsed.data as BlockStyles
  warnings.push(`Some styles on "${type}" were invalid and dropped`)
  // Keep only the individually-valid declarations rather than dropping all.
  const kept: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(style)) {
    if (blockStylesSchema.safeParse({ [k]: v }).success)
      kept[k] = v
  }
  return Object.keys(kept).length ? (kept as BlockStyles) : undefined
}

/**
 * Convert AI block specs into real `PageBlock`s against the registry. Unknown
 * types are skipped, invalid props fall back to the type's defaults, invalid
 * styles are pruned — every repair is recorded in `warnings`.
 */
export function buildBlocks(specs: AiBlockSpec[], registry: BlockRegistry): BuildResult {
  const warnings: string[] = []

  function build(spec: AiBlockSpec): PageBlock | null {
    const definition = registry[spec.type]
    if (!definition) {
      warnings.push(`Unknown block type "${spec.type}" — skipped`)
      return null
    }

    const block = createBlock(definition, spec.props as Record<string, never> | undefined)

    // Props are merged onto defaults by createBlock; if the result is invalid,
    // reset to defaults rather than committing a broken block.
    if (spec.props && !validateBlockProps(block, registry).success) {
      warnings.push(`Invalid props for "${spec.type}" — used defaults`)
      block.props = { ...definition.defaultProps }
    }

    const style = coerceStyle(spec.style, warnings, spec.type)
    if (style)
      block.style = { ...(block.style ?? {}), ...style }
    else if (!spec.style)
      // leave createBlock's defaultStyle (if any) untouched
      void 0

    if (spec.classes?.length)
      block.classes = [...spec.classes]

    if (spec.children?.length) {
      if (definition.acceptsChildren) {
        const kids = spec.children.map(build).filter((b): b is PageBlock => b !== null)
        if (kids.length)
          block.children = kids
      }
      else {
        warnings.push(`"${spec.type}" can't contain children — dropped ${spec.children.length}`)
      }
    }

    return block
  }

  const blocks = specs.map(build).filter((b): b is PageBlock => b !== null)
  return { blocks, warnings }
}

/** Serialize a live block back to the AI spec shape (drops ids) — editing context. */
export function blockToSpec(block: PageBlock): AiBlockSpec {
  const spec: AiBlockSpec = { type: block.type }
  if (block.props && Object.keys(block.props).length)
    spec.props = block.props
  if (block.style && Object.keys(block.style).length)
    spec.style = block.style as Record<string, unknown>
  if (block.classes?.length)
    spec.classes = [...block.classes]
  if (block.children?.length)
    spec.children = block.children.map(blockToSpec)
  return spec
}
