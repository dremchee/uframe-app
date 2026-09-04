import type { BlockDefinition, BlockPreset, BlockPresetChild, BlockRegistry } from '@/core/types/block-registry'
import type { PageBlock } from '@/core/types/page-document'
import { createBlock } from '@/core/utils/document-tree'

/**
 * Presets exist only at insertion time. They resolve to an ordinary block of
 * the owning type — `props` over `defaultProps`, `style` over `defaultStyle`,
 * plus an optional starter subtree — and leave no marker behind: the document
 * never knows which preset a block came from. See `BlockPreset`.
 */

function withPresetStyle(block: PageBlock, style: BlockPreset['style']): PageBlock {
  if (!style || !Object.keys(style).length)
    return block
  return { ...block, style: { ...(block.style ?? {}), ...style } }
}

function createPresetChildren(
  children: BlockPresetChild[] | undefined,
  registry: BlockRegistry,
): PageBlock[] | undefined {
  if (!children?.length)
    return undefined
  const out: PageBlock[] = []
  for (const child of children) {
    // A child type this registry doesn't know is dropped rather than inserted
    // as a stub — the canvas would only render it as an unknown block.
    const definition = registry[child.type]
    if (!definition)
      continue
    const block = withPresetStyle(createBlock(definition, child.props), child.style)
    const nested = createPresetChildren(child.children, registry)
    out.push(nested ? { ...block, children: nested } : block)
  }
  return out.length ? out : undefined
}

/** Builds the block a preset describes, resolving its children against `registry`. */
export function createPresetBlock<TProps>(
  definition: BlockDefinition<TProps>,
  preset: BlockPreset<TProps>,
  registry: BlockRegistry,
): PageBlock<TProps> {
  const block = withPresetStyle(createBlock(definition, preset.props) as PageBlock, preset.style)
  const children = createPresetChildren(preset.children, registry)
  return (children ? { ...block, children } : block) as PageBlock<TProps>
}

/** The preset with `presetId` on `definition`, if any. */
export function findBlockPreset(
  definition: BlockDefinition | undefined,
  presetId: string | undefined,
): BlockPreset | undefined {
  if (!definition || !presetId)
    return undefined
  return definition.presets?.find(preset => preset.id === presetId)
}

/**
 * Creates a new block of `type`, from `presetId` when the definition has that
 * preset and from the plain defaults otherwise. A stale or foreign preset id
 * (a drag payload from another registry, say) degrades to the plain block
 * rather than failing the insertion. `undefined` for an unregistered type.
 */
export function instantiateBlock(
  registry: BlockRegistry,
  type: string,
  presetId?: string,
): PageBlock | undefined {
  const definition = registry[type]
  if (!definition)
    return undefined
  const preset = findBlockPreset(definition, presetId)
  return preset ? createPresetBlock(definition, preset, registry) : createBlock(definition)
}
