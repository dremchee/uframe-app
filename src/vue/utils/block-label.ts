import type { BlockDefinition, PageBlock } from '@/core'
import type { I18n } from '@/vue/i18n'
import { translatedOrFallback } from '@/vue/utils/translation-fallback'

/** Converts a block type such as `select-option` to its catalog key segment. */
export function blockMetaKey(type: string): string {
  return type.replace(/-([a-z])/g, (_, character: string) => character.toUpperCase())
}

/** Resolves a block-library label, including plugin keys and plain-label fallback. */
export function localizedBlockLabel(
  type: string,
  definition: BlockDefinition | undefined,
  t: I18n['t'],
): string {
  const key = definition?.labelKey ?? `blocks.meta.${blockMetaKey(type)}.label`
  return translatedOrFallback(key, definition?.label, t) ?? type
}

/** Resolves a block's user-defined name before falling back to its catalog label. */
export function displayBlockLabel(
  block: Pick<PageBlock, 'type' | 'name'>,
  definition: BlockDefinition | undefined,
  t: I18n['t'],
): string {
  return block.name?.trim() || localizedBlockLabel(block.type, definition, t)
}

/** Resolves a block-library description, including plugin keys and plain fallback. */
export function localizedBlockDescription(
  type: string,
  definition: BlockDefinition | undefined,
  t: I18n['t'],
): string | undefined {
  const key = definition?.descriptionKey ?? `blocks.meta.${blockMetaKey(type)}.description`
  return translatedOrFallback(key, definition?.description, t)
}

/** Resolves a block-library category, including plugin keys and plain fallback. */
export function localizedBlockCategory(definition: BlockDefinition, t: I18n['t']): string {
  const fallback = definition.category ?? 'Other'
  const key = definition.categoryKey ?? `blocks.categories.${fallback}`
  return translatedOrFallback(key, fallback, t) ?? fallback
}
