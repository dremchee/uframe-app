/** Immutable list operations for component models that emit a replacement array. */
export function appendListItem<T>(items: readonly T[] | undefined, item: T): T[] {
  return [...(items ?? []), item]
}

export function insertListItem<T>(items: readonly T[] | undefined, index: number, item: T): T[] {
  const next = [...(items ?? [])]
  const safeIndex = Math.max(0, Math.min(index, next.length))
  next.splice(safeIndex, 0, item)
  return next
}

export function replaceListItem<T>(items: readonly T[] | undefined, index: number, item: T): T[] {
  const next = [...(items ?? [])]
  if (!Number.isInteger(index) || index < 0 || index >= next.length)
    return next
  next[index] = item
  return next
}

export function removeListItem<T>(items: readonly T[] | undefined, index: number): T[] {
  const next = [...(items ?? [])]
  if (!Number.isInteger(index) || index < 0 || index >= next.length)
    return next
  next.splice(index, 1)
  return next
}

export function moveListItem<T>(items: readonly T[] | undefined, from: number, to: number): T[] {
  const next = [...(items ?? [])]
  if (
    !Number.isInteger(from)
    || !Number.isInteger(to)
    || from < 0
    || to < 0
    || from >= next.length
    || to >= next.length
  ) {
    return next
  }
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}
