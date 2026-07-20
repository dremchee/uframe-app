import { isRecord } from '@/core/utils/records'

export type RecordTree = Record<string, unknown>

/**
 * Immutably merges nested records. Arrays, `null`, and primitive values are
 * leaves, so an override replaces them instead of attempting a structural merge.
 */
export function deepMergeRecord(base: RecordTree, override: RecordTree | undefined): RecordTree {
  if (!override)
    return base

  const merged: RecordTree = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = merged[key]
    merged[key] = isRecord(current) && isRecord(value)
      ? deepMergeRecord(current, value)
      : value
  }
  return merged
}
