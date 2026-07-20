import type { CssVariable, PageDocument } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'
import { parseVarRef, resolveVarValue, rewriteStyleVarRefs, rewriteVarRefs, sanitizeVarName, serializeVariables, toVarRef } from '@/core/utils/css-variables'
import { serializeDocumentStyles } from '@/core/utils/styles'

describe('sanitizeVarName', () => {
  it('keeps valid identifiers untouched', () => {
    expect(sanitizeVarName('brand')).toBe('brand')
    expect(sanitizeVarName('space-md')).toBe('space-md')
    expect(sanitizeVarName('_private')).toBe('_private')
  })

  it('replaces invalid chars with hyphens and collapses runs', () => {
    expect(sanitizeVarName('my brand color')).toBe('my-brand-color')
    expect(sanitizeVarName('a@@@b')).toBe('a-b')
  })

  it('returns empty when the result cannot start a CSS identifier', () => {
    expect(sanitizeVarName('123')).toBe('')
    expect(sanitizeVarName('   ')).toBe('')
    expect(sanitizeVarName('-9')).toBe('')
  })
})

describe('parseVarRef / toVarRef', () => {
  it('extracts the name from a bare var() reference', () => {
    expect(parseVarRef('var(--brand)')).toBe('brand')
    expect(parseVarRef('  var( --space-md )  ')).toBe('space-md')
    expect(parseVarRef('var(--_private)')).toBe('_private')
  })

  it('tolerates a fallback argument', () => {
    expect(parseVarRef('var(--brand, #fff)')).toBe('brand')
    expect(parseVarRef('var(--gap, 8px)')).toBe('gap')
  })

  it('returns null for anything that is not a single var() reference', () => {
    expect(parseVarRef('#3b82f6')).toBeNull()
    expect(parseVarRef('16px')).toBeNull()
    expect(parseVarRef('')).toBeNull()
    expect(parseVarRef(undefined)).toBeNull()
    expect(parseVarRef('calc(var(--gap) * 2)')).toBeNull()
    expect(parseVarRef('var(--9bad)')).toBeNull()
  })

  it('round-trips through toVarRef', () => {
    expect(parseVarRef(toVarRef('brand'))).toBe('brand')
    expect(toVarRef('space-md')).toBe('var(--space-md)')
  })
})

describe('resolveVarValue', () => {
  it('returns a concrete value unchanged', () => {
    expect(resolveVarValue('#3b82f6', new Map())).toBe('#3b82f6')
  })

  it('resolves a single reference', () => {
    const vars = new Map([['brand', '#3b82f6']])
    expect(resolveVarValue('var(--brand)', vars)).toBe('#3b82f6')
  })

  it('follows a var → var chain', () => {
    const vars = new Map([['brand', 'var(--blue)'], ['blue', '#3b82f6']])
    expect(resolveVarValue('var(--brand)', vars)).toBe('#3b82f6')
  })

  it('breaks reference cycles via the depth limit', () => {
    const vars = new Map([['a', 'var(--b)'], ['b', 'var(--a)']])
    // does not throw / hang; bottoms out at the last visited reference
    expect(parseVarRef(resolveVarValue('var(--a)', vars))).not.toBeNull()
  })

  it('returns the var() text when the variable is missing', () => {
    expect(resolveVarValue('var(--gone)', new Map())).toBe('var(--gone)')
  })
})

describe('rewriteVarRefs', () => {
  it('rewrites a bare reference', () => {
    expect(rewriteVarRefs('var(--brand)', 'brand', 'primary')).toBe('var(--primary)')
  })

  it('rewrites references nested in larger expressions and fallbacks', () => {
    expect(rewriteVarRefs('calc(var(--gap) * 2)', 'gap', 'space')).toBe('calc(var(--space) * 2)')
    expect(rewriteVarRefs('var(--x, var(--gap))', 'gap', 'space')).toBe('var(--x, var(--space))')
    expect(rewriteVarRefs('0 2px var(--shadow)', 'shadow', 'elevation')).toBe('0 2px var(--elevation)')
  })

  it('rewrites every occurrence', () => {
    expect(rewriteVarRefs('var(--a) var(--a)', 'a', 'b')).toBe('var(--b) var(--b)')
  })

  it('matches the name exactly — a prefix is left alone', () => {
    expect(rewriteVarRefs('var(--space-md)', 'space', 'gap')).toBe('var(--space-md)')
    expect(rewriteVarRefs('var(--spaced)', 'space', 'gap')).toBe('var(--spaced)')
  })

  it('tolerates whitespace inside var()', () => {
    expect(rewriteVarRefs('var( --brand )', 'brand', 'primary')).toBe('var( --primary )')
  })

  it('returns the same reference when nothing matched', () => {
    const value = 'var(--other)'
    expect(rewriteVarRefs(value, 'brand', 'primary')).toBe(value)
    expect(rewriteVarRefs('#fff', 'brand', 'primary')).toBe('#fff')
  })
})

describe('rewriteStyleVarRefs', () => {
  it('rewrites base, state and responsive declarations', () => {
    const styles = {
      color: 'var(--brand)',
      gap: '8px',
      states: { hover: { backgroundColor: 'var(--brand)' } },
      responsive: { mobile: { color: 'var(--brand)' } },
    }
    expect(rewriteStyleVarRefs(styles, 'brand', 'primary')).toEqual({
      color: 'var(--primary)',
      gap: '8px',
      states: { hover: { backgroundColor: 'var(--primary)' } },
      responsive: { mobile: { color: 'var(--primary)' } },
    })
  })

  it('returns the same reference when no value changed', () => {
    const styles = { color: 'var(--other)', gap: '8px' }
    expect(rewriteStyleVarRefs(styles, 'brand', 'primary')).toBe(styles)
  })

  it('handles undefined', () => {
    expect(rewriteStyleVarRefs(undefined, 'brand', 'primary')).toBeUndefined()
  })
})

describe('serializeVariables', () => {
  it('returns empty for missing or empty input', () => {
    expect(serializeVariables(undefined)).toBe('')
    expect(serializeVariables([])).toBe('')
  })

  it('emits a :root block with --name: value declarations', () => {
    const vars: CssVariable[] = [
      { key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' },
      { key: 'space', name: 'space', value: '16px', type: 'size' },
    ]
    expect(serializeVariables(vars)).toBe(':root { --brand: #14b8a6; --space: 16px }')
  })

  it('skips entries with empty value or unusable name', () => {
    const vars: CssVariable[] = [
      { key: 'brand', name: 'brand', value: '#000', type: 'color' },
      { key: 'empty', name: 'empty', value: '   ', type: 'other' },
      { key: '123', name: '123', value: '#fff', type: 'color' },
    ]
    expect(serializeVariables(vars)).toBe(':root { --brand: #000 }')
  })

  it('de-duplicates by name — last declaration wins', () => {
    const vars: CssVariable[] = [
      { key: 'brand', name: 'brand', value: '#111', type: 'color' },
      { key: 'brand', name: 'brand', value: '#222', type: 'color' },
    ]
    expect(serializeVariables(vars)).toBe(':root { --brand: #222 }')
  })

  it('passes arbitrary CSS values through (shadow, font stack, var())', () => {
    const vars: CssVariable[] = [
      { key: 'shadow', name: 'shadow', value: '0 2px 8px rgba(0,0,0,.1)', type: 'shadow' },
      { key: 'alias', name: 'alias', value: 'var(--brand)', type: 'other' },
    ]
    expect(serializeVariables(vars)).toBe(
      ':root { --shadow: 0 2px 8px rgba(0,0,0,.1); --alias: var(--brand) }',
    )
  })
})

describe('serializeDocumentStyles with variables', () => {
  function makeDoc(): PageDocument {
    return {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff', style: { color: '#222' } },
      variables: [{ key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' }],
      blocks: [{ id: 'h', type: 'heading', props: {}, style: { color: 'var(--brand)' } }],
    }
  }

  it('emits :root first, before body/block rules', () => {
    const css = serializeDocumentStyles(makeDoc())
    const lines = css.split('\n')
    expect(lines[0]).toBe(':root { --brand: #14b8a6 }')
    expect(css.indexOf(':root')).toBeLessThan(css.indexOf('body'))
    expect(css).toContain('.uf-block-h { color: var(--brand) }')
  })

  it('omits :root when there are no variables', () => {
    const doc = makeDoc()
    doc.variables = []
    expect(serializeDocumentStyles(doc).startsWith(':root')).toBe(false)
  })
})

describe('pageDocumentSchema variables', () => {
  function baseDoc(variables: unknown) {
    return {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [],
      variables,
    }
  }

  it('requires a stable key', () => {
    expect(pageDocumentSchema.safeParse(baseDoc([{ name: 'brand', value: '#000', type: 'color' }])).success).toBe(false)
  })

  it('rejects invalid variable keys', () => {
    expect(pageDocumentSchema.safeParse(baseDoc([{ key: '1bad', name: 'Brand', value: '#000', type: 'color' }])).success).toBe(false)
    expect(pageDocumentSchema.safeParse(baseDoc([{ key: 'has space', name: 'Brand', value: '#000', type: 'color' }])).success).toBe(false)
  })

  it('rejects unknown variable types', () => {
    expect(pageDocumentSchema.safeParse(baseDoc([{ key: 'x', name: 'X', value: '1', type: 'spacing' }])).success).toBe(false)
  })

  it('treats variables as optional', () => {
    expect(pageDocumentSchema.safeParse(baseDoc(undefined)).success).toBe(true)
  })
})
