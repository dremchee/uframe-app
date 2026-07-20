/**
 * Clones values using the project's persisted-document semantics.
 *
 * This intentionally mirrors JSON serialization (for example, undefined
 * object members are omitted) rather than using structuredClone.
 */
export function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
