// A node in the page-group tree. Groups nest via "/"-separated paths stored in
// each page's `group` attribute; this turns the flat set of paths into a tree.
export interface GroupNode {
  /** Full path, e.g. "Blog/Drafts". */
  path: string
  /** Last segment, e.g. "Drafts". */
  name: string
  children: GroupNode[]
}

/**
 * Build a group tree from a flat list of paths. Intermediate ancestors are
 * created even if no path names them directly (e.g. "a/b/c" implies "a", "a/b").
 * First-appearance order is preserved at every level.
 */
export function buildGroupTree(paths: string[]): GroupNode[] {
  const roots: GroupNode[] = []
  const byPath = new Map<string, GroupNode>()

  function ensure(path: string): GroupNode {
    const existing = byPath.get(path)
    if (existing)
      return existing
    const i = path.lastIndexOf('/')
    const node: GroupNode = { path, name: i === -1 ? path : path.slice(i + 1), children: [] }
    byPath.set(path, node)
    if (i === -1)
      roots.push(node)
    else
      ensure(path.slice(0, i)).children.push(node)
    return node
  }

  for (const path of paths) {
    if (!path)
      continue
    let acc = ''
    for (const seg of path.split('/')) {
      acc = acc ? `${acc}/${seg}` : seg
      ensure(acc)
    }
  }
  return roots
}

/** Rewrites one exact group path or any of its descendants. */
export function rewriteGroupPath(group: string | undefined, fromPath: string, toPath: string): string | undefined {
  if (!group)
    return group
  if (group === fromPath)
    return toPath
  if (group.startsWith(`${fromPath}/`))
    return `${toPath}${group.slice(fromPath.length)}`
  return group
}

/** Builds a renamed path while rejecting blank or nested segment names. */
export function renameGroupPath(fromPath: string, newName: string): string | null {
  const segment = newName.trim()
  if (!fromPath || !segment || segment.includes('/'))
    return null
  const index = fromPath.lastIndexOf('/')
  return index === -1 ? segment : `${fromPath.slice(0, index + 1)}${segment}`
}

/** Builds a reparented group path, rejecting self- and descendant-cycles. */
export function moveGroupPath(fromPath: string, toParent: string | null): string | null {
  if (!fromPath || toParent === fromPath || toParent?.startsWith(`${fromPath}/`))
    return null
  const segment = fromPath.split('/').at(-1) ?? fromPath
  const toPath = toParent ? `${toParent}/${segment}` : segment
  return toPath === fromPath ? null : toPath
}
