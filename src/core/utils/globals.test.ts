import type { BreakpointDef } from '@/core/types/block-styles'
import type { GlobalSettings, PageDocument, SymbolDefinition } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { createGlobalSettings, mergeGlobalsIntoDocument, safeParseGlobalSettings } from '@/core/utils/globals'
import { serializeDocumentStyles } from '@/core/utils/styles'

function makeDoc(overrides: Partial<PageDocument> = {}): PageDocument {
  return {
    id: 'p',
    title: 'p',
    version: 1,
    updatedAt: '',
    settings: { width: 'responsive', background: '#fff' },
    blocks: [],
    ...overrides,
  }
}

function makeSymbol(id: string, name: string): SymbolDefinition {
  return {
    id,
    name,
    updatedAt: '',
    root: { id: `${id}-root`, type: 'div', props: {} },
    variants: [{ id: 'default', name: 'Default', classes: [] }],
    defaultVariantId: 'default',
  }
}

describe('createGlobalSettings', () => {
  it('seeds empty collections and version 1', () => {
    expect(createGlobalSettings()).toEqual({
      variables: [],
      breakpoints: [],
      styles: {},
      symbols: {},
      defaults: {},
      version: 1,
      updatedAt: '',
    })
  })

  it('applies overrides', () => {
    const globals = createGlobalSettings({ variables: [{ key: 'brand', name: 'brand', value: '#000', type: 'color' }], version: 3 })
    expect(globals.variables).toEqual([{ key: 'brand', name: 'brand', value: '#000', type: 'color' }])
    expect(globals.version).toBe(3)
  })
})

describe('mergeGlobalsIntoDocument', () => {
  it('returns the document untouched when there is no globals', () => {
    const doc = makeDoc()
    expect(mergeGlobalsIntoDocument(doc, null)).toBe(doc)
    expect(mergeGlobalsIntoDocument(doc, undefined)).toBe(doc)
  })

  it('takes variables from the globals, overriding any document copy', () => {
    const doc = makeDoc({ variables: [{ key: 'old', name: 'old', value: '#111', type: 'color' }] })
    const globals = createGlobalSettings({ variables: [{ key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' }] })
    expect(mergeGlobalsIntoDocument(doc, globals).variables).toEqual([{ key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' }])
  })

  it('does not read document variables when globals owns the shared context', () => {
    const doc = makeDoc({ variables: [{ key: 'old', name: 'old', value: '#111', type: 'color' }] })
    const globals: GlobalSettings = { version: 1, updatedAt: '' } // no variables key
    expect(mergeGlobalsIntoDocument(doc, globals).variables).toBeUndefined()
  })

  it('takes breakpoints from the globals', () => {
    const bps: BreakpointDef[] = [{ id: 'sm', label: 'SM', direction: 'max', width: 600 }]
    const doc = makeDoc({ settings: { width: 'responsive', background: '#fff', breakpoints: [{ id: 'x', label: 'X', direction: 'max', width: 999 }] } })
    const globals = createGlobalSettings({ breakpoints: bps })
    expect(mergeGlobalsIntoDocument(doc, globals).settings.breakpoints).toEqual(bps)
  })

  it('unions styles with the document key winning on conflict', () => {
    const doc = makeDoc({ styles: { card: { color: 'doc' }, local: { color: 'only-doc' } } })
    const globals = createGlobalSettings({ styles: { card: { color: 'globals' }, shared: { color: 'only-globals' } } })
    expect(mergeGlobalsIntoDocument(doc, globals).styles).toEqual({
      card: { color: 'doc' },
      shared: { color: 'only-globals' },
      local: { color: 'only-doc' },
    })
  })

  it('unions symbols with the document key winning on conflict', () => {
    const docSym = makeSymbol('header', 'Doc header')
    const globalsHeader = makeSymbol('header', 'Site header')
    const globalsFooter = makeSymbol('footer', 'Site footer')
    const doc = makeDoc({ symbols: { header: docSym } })
    const globals = createGlobalSettings({ symbols: { header: globalsHeader, footer: globalsFooter } })
    const merged = mergeGlobalsIntoDocument(doc, globals).symbols
    expect(merged?.header).toBe(docSym)
    expect(merged?.footer).toBe(globalsFooter)
  })

  it('lets the document override the globals background default, else inherits it', () => {
    const globals = createGlobalSettings({ defaults: { background: '#globals' } })
    expect(mergeGlobalsIntoDocument(makeDoc({ settings: { width: 'responsive', background: '#doc' } }), globals).settings.background).toBe('#doc')
    expect(mergeGlobalsIntoDocument(makeDoc({ settings: { width: 'responsive', background: '' } }), globals).settings.background).toBe('#globals')
  })

  it('merges the globals default style under the document style per property', () => {
    const globals = createGlobalSettings({ defaults: { style: { fontFamily: 'Inter', color: '#globals' } } })
    const doc = makeDoc({ settings: { width: 'responsive', background: '#fff', style: { color: '#doc' } } })
    expect(mergeGlobalsIntoDocument(doc, globals).settings.style).toEqual({ fontFamily: 'Inter', color: '#doc' })
  })

  it('does not mutate its inputs', () => {
    const doc = makeDoc({ variables: [{ key: 'old', name: 'old', value: '#111', type: 'color' }], styles: { local: { color: 'x' } } })
    const globals = createGlobalSettings({ variables: [{ key: 'brand', name: 'brand', value: '#000', type: 'color' }], styles: { shared: { color: 'y' } } })
    const docSnap = structuredClone(doc)
    const globalsSnap = structuredClone(globals)
    const merged = mergeGlobalsIntoDocument(doc, globals)
    expect(merged).not.toBe(doc)
    expect(doc).toEqual(docSnap)
    expect(globals).toEqual(globalsSnap)
  })
})

describe('globalSettingsSchema', () => {
  it('accepts a minimal globals', () => {
    expect(safeParseGlobalSettings({ version: 1, updatedAt: '' }).success).toBe(true)
  })

  it('accepts a full valid globals and round-trips it', () => {
    const globals: GlobalSettings = createGlobalSettings({
      variables: [{ key: 'brand', name: 'brand', value: '#000', type: 'color' }],
      breakpoints: [{ id: 'sm', label: 'SM', direction: 'max', width: 600 }],
      defaults: { background: '#fff', style: { fontFamily: 'Inter' } },
    })
    const result = safeParseGlobalSettings(globals)
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toEqual(globals)
  })

  it('rejects an invalid variable name', () => {
    expect(safeParseGlobalSettings({ version: 1, updatedAt: '', variables: [{ name: '1bad', value: '#000', type: 'color' }] }).success).toBe(false)
  })

  it('rejects a between breakpoint without a larger widthMax', () => {
    expect(safeParseGlobalSettings({ version: 1, updatedAt: '', breakpoints: [{ id: 'b', label: 'B', direction: 'between', width: 600 }] }).success).toBe(false)
  })

  it('requires a positive integer version', () => {
    expect(safeParseGlobalSettings({ version: 0, updatedAt: '' }).success).toBe(false)
    expect(safeParseGlobalSettings({ updatedAt: '' }).success).toBe(false)
  })
})

describe('serializeDocumentStyles on the merged document', () => {
  it('emits globals variables, default style, classes and breakpoint media', () => {
    const doc = makeDoc({
      blocks: [{ id: 'h', type: 'heading', props: {}, style: { color: 'var(--brand)', responsive: { sm: { color: '#f00' } } } }],
    })
    const globals = createGlobalSettings({
      variables: [{ key: 'brand', name: 'brand', value: '#14b8a6', type: 'color' }],
      breakpoints: [{ id: 'sm', label: 'SM', direction: 'max', width: 600 }],
      styles: { card: { backgroundColor: '#abcdef' } },
      defaults: { style: { fontFamily: 'Inter' } },
    })

    const css = serializeDocumentStyles(mergeGlobalsIntoDocument(doc, globals))

    expect(css).toContain(':root { --brand: #14b8a6 }')
    expect(css).toContain('font-family: Inter')
    expect(css).toContain('#abcdef')
    expect(css).toContain('.uf-block-h { color: var(--brand) }')
    expect(css).toContain('@media')
    expect(css).toContain('600px')
  })
})
