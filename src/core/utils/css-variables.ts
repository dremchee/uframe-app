import type { CssVariable } from '@/core/types/page-document'
import { sanitizeCssValue } from '@/core/utils/css'
import { isRecord } from '@/core/utils/records'

/** Coerces arbitrary input into a valid CSS custom-property name without `--`. */
export function sanitizeVarName(input: string): string {
  const cleaned = input.trim().replace(/[^\w-]/g, '-').replace(/-+/g, '-')
  return /^[a-z_]/i.test(cleaned) ? cleaned : ''
}

/** Serializes user-defined custom properties into a safe `:root` rule. */
export function serializeVariables(variables: CssVariable[] | undefined): string {
  if (!variables?.length)
    return ''

  const declarations = new Map<string, string>()
  for (const variable of variables) {
    const name = sanitizeVarName(variable.key)
    const value = sanitizeCssValue(variable.value)
    if (name && value)
      declarations.set(name, value)
  }

  if (!declarations.size)
    return ''
  const body = Array.from(declarations, ([name, value]) => `--${name}: ${value}`).join('; ')
  return `:root { ${body} }`
}

const VAR_REF_RE = /^var\(\s*--([a-zA-Z_][\w-]*)\s*(?:,[^)]*)?\)$/

/** Extracts the custom-property name from a standalone `var(--name)` reference. */
export function parseVarRef(value: string | undefined | null): string | null {
  if (!value)
    return null
  const match = VAR_REF_RE.exec(value.trim())
  return match ? match[1] : null
}

export function toVarRef(name: string): string {
  return `var(--${name})`
}

/** Resolves chained standalone var references, with a bounded depth for cycles. */
export function resolveVarValue(value: string, variables: Map<string, string>, maxDepth = 8): string {
  let current = value
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const name = parseVarRef(current)
    if (name == null)
      return current
    const next = variables.get(name)
    if (next === undefined)
      return current
    current = next
  }
  return current
}

/** Rewrites exact `var(--oldName)` references, including nested expressions. */
export function rewriteVarRefs(value: string, oldName: string, newName: string): string {
  if (!value.includes(`--${oldName}`))
    return value
  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const expression = new RegExp(`(var\\(\\s*--)${escaped}(?=[\\s,)])`, 'g')
  return value.replace(expression, `$1${newName}`)
}

/** Applies a var-reference rename recursively without cloning unchanged branches. */
export function rewriteStyleVarRefs<T>(styles: T, oldName: string, newName: string): T {
  return rewriteStringsDeep(styles, value => rewriteVarRefs(value, oldName, newName))
}

function rewriteStringsDeep<T>(node: T, rewrite: (value: string) => string): T {
  if (typeof node === 'string')
    return rewrite(node) as T
  if (Array.isArray(node)) {
    let changed = false
    const next = node.map((item) => {
      const value = rewriteStringsDeep(item, rewrite)
      changed ||= value !== item
      return value
    })
    return (changed ? next : node) as T
  }
  if (isRecord(node)) {
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      const output = rewriteStringsDeep(value, rewrite)
      changed ||= output !== value
      next[key] = output
    }
    return (changed ? next : node) as T
  }
  return node
}
