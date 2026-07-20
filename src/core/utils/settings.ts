import type { BlockDefinition, SettingsField } from '@/core/types/block-registry'

// Resolve the schema-driven settings fields for a block definition:
// - `settings` as an array → used as-is.
// - `settings: 'auto'` → inferred from `defaultProps` value types.
// - no `settings` → null (the block has no schema-driven Content tab).
export function resolveSettingsFields(definition: BlockDefinition | undefined): SettingsField[] | null {
  const settings = definition?.settings
  if (!settings)
    return null
  if (Array.isArray(settings))
    return settings

  const props = (definition?.defaultProps ?? {}) as Record<string, unknown>
  const fields: SettingsField[] = []
  for (const [key, value] of Object.entries(props)) {
    let type: SettingsField['type'] = 'text'
    if (typeof value === 'boolean')
      type = 'boolean'
    else if (typeof value === 'number')
      type = 'number'
    fields.push({ key, type })
  }
  return fields
}
