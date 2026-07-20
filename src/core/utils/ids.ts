/** Short, readable ids for document nodes and editor-owned entities. */
export function createShortId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  return `${prefix}_${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`
}

/** Collision-resistant ids for independently reorderable effect entries. */
export function createUniqueId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/** Returns the first available readable name, adding a numeric suffix on collision. */
export function createUniqueName(base: string, taken: Iterable<string>, separator = '-'): string {
  const names = new Set(taken)
  if (!names.has(base))
    return base
  let suffix = 2
  while (names.has(`${base}${separator}${suffix}`))
    suffix += 1
  return `${base}${separator}${suffix}`
}
