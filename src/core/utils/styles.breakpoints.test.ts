import type { BlockStyles, BreakpointDef } from '@/core/types/block-styles'
import type { PageDocument } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'
import { breakpointRangeLabel, breakpointsInCascadeOrder, breakpointUpperBound, inheritedBreakpointIds, resolveBreakpoints } from '@/core/utils/breakpoints'
import { serializeDocumentStyles } from '@/core/utils/styles'

function docWithBlock(style: BlockStyles, breakpoints?: BreakpointDef[]): PageDocument {
  return {
    id: 'p',
    title: 'p',
    version: 1,
    updatedAt: '',
    settings: { width: 'responsive', background: '#fff', ...(breakpoints ? { breakpoints } : {}) },
    blocks: [{ id: 'h', type: 'heading', props: {}, style }],
  }
}

describe('serializeDocumentStyles breakpoints', () => {
  it('emits the default set with the right direction per breakpoint', () => {
    const css = serializeDocumentStyles(docWithBlock({
      responsive: {
        wide: { fontSize: '40px' },
        tablet: { fontSize: '24px' },
        mobile: { fontSize: '16px' },
        mobileSm: { fontSize: '12px' },
      },
    }))
    expect(css).toContain('@media (width >= 1440px) { .uf-block-h { font-size: 40px } }')
    expect(css).toContain('@media (width <= 1024px) { .uf-block-h { font-size: 24px } }')
    expect(css).toContain('@media (width <= 768px) { .uf-block-h { font-size: 16px } }')
    expect(css).toContain('@media (width <= 480px) { .uf-block-h { font-size: 12px } }')
  })

  it('emits user-defined breakpoints by id', () => {
    const bps: BreakpointDef[] = [
      { id: 'huge', label: 'Huge', direction: 'min', width: 1920 },
      { id: 'phone', label: 'Phone', direction: 'max', width: 520 },
    ]
    const css = serializeDocumentStyles(docWithBlock(
      { responsive: { huge: { color: '#a' }, phone: { color: '#b' } } },
      bps,
    ))
    expect(css).toContain('@media (width >= 1920px) { .uf-block-h { color: #a } }')
    expect(css).toContain('@media (width <= 520px) { .uf-block-h { color: #b } }')
  })

  it('emits a between breakpoint as a range query', () => {
    const css = serializeDocumentStyles(docWithBlock(
      { responsive: { mid: { color: '#c' } } },
      [{ id: 'mid', label: 'Mid', direction: 'between', width: 600, widthMax: 900 }],
    ))
    expect(css).toContain('@media (600px <= width <= 900px) { .uf-block-h { color: #c } }')
  })

  it('orders min-width before max-width, max-width widest → narrowest', () => {
    const css = serializeDocumentStyles(docWithBlock({
      responsive: {
        mobileSm: { color: '#1' },
        mobile: { color: '#2' },
        tablet: { color: '#3' },
        wide: { color: '#4' },
      },
    }))
    const order = ['width >= 1440', 'width <= 1024', 'width <= 768', 'width <= 480']
      .map(q => css.indexOf(q))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order.every(i => i >= 0)).toBe(true)
  })
})

describe('breakpoint helpers', () => {
  const list: BreakpointDef[] = [
    { id: 'wide', label: 'Wide', direction: 'min', width: 1440 },
    { id: 'tablet', label: 'Tablet', direction: 'max', width: 1024 },
    { id: 'mobile', label: 'Mobile', direction: 'max', width: 768 },
    { id: 'mobileSm', label: 'S', direction: 'max', width: 480 },
  ]

  it('resolveBreakpoints falls back to the default set', () => {
    expect(resolveBreakpoints({ breakpoints: undefined }).length).toBeGreaterThan(0)
    expect(resolveBreakpoints({ breakpoints: list })).toBe(list)
  })

  it('uses a between breakpoint upper bound for visual and preview contexts', () => {
    expect(breakpointUpperBound({ direction: 'between', width: 600, widthMax: 900 })).toBe(900)
    expect(breakpointUpperBound({ direction: 'max', width: 600 })).toBe(600)
  })

  it('formats breakpoint ranges consistently for controls', () => {
    expect(breakpointRangeLabel({ direction: 'between', width: 600, widthMax: 900 })).toBe('600–900px')
    expect(breakpointRangeLabel({ direction: 'min', width: 1024 })).toBe('≥1024px')
    expect(breakpointRangeLabel({ direction: 'max', width: 768 })).toBe('≤768px')
  })

  it('breakpointsInCascadeOrder: min asc then max desc', () => {
    expect(breakpointsInCascadeOrder(list).map(b => b.id)).toEqual(['wide', 'tablet', 'mobile', 'mobileSm'])
  })

  it('inheritedBreakpointIds: same-direction ancestors in apply order', () => {
    expect(inheritedBreakpointIds(list, 'mobileSm')).toEqual(['tablet', 'mobile'])
    expect(inheritedBreakpointIds(list, 'tablet')).toEqual([])
    expect(inheritedBreakpointIds(list, 'wide')).toEqual([])
  })
})

describe('pageDocumentSchema breakpoints', () => {
  function docWith(breakpoints: unknown) {
    return {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff', breakpoints },
      blocks: [],
    }
  }

  it('accepts a list of breakpoint defs', () => {
    const r = pageDocumentSchema.safeParse(docWith([{ id: 'sm', label: 'Small', direction: 'max', width: 600 }]))
    expect(r.success).toBe(true)
  })

  it('rejects invalid ids, directions and widths', () => {
    expect(pageDocumentSchema.safeParse(docWith([{ id: '1bad', label: 'x', direction: 'max', width: 600 }])).success).toBe(false)
    expect(pageDocumentSchema.safeParse(docWith([{ id: 'sm', label: 'x', direction: 'sideways', width: 600 }])).success).toBe(false)
    expect(pageDocumentSchema.safeParse(docWith([{ id: 'sm', label: 'x', direction: 'max', width: 0 }])).success).toBe(false)
  })

  it('validates between needs widthMax greater than width', () => {
    expect(pageDocumentSchema.safeParse(docWith([{ id: 'mid', label: 'Mid', direction: 'between', width: 600, widthMax: 900 }])).success).toBe(true)
    expect(pageDocumentSchema.safeParse(docWith([{ id: 'mid', label: 'Mid', direction: 'between', width: 600 }])).success).toBe(false)
    expect(pageDocumentSchema.safeParse(docWith([{ id: 'mid', label: 'Mid', direction: 'between', width: 900, widthMax: 600 }])).success).toBe(false)
  })

  it('rejects the deprecated threshold-map format', () => {
    expect(pageDocumentSchema.safeParse(docWith({ tablet: 1024, mobile: 768 })).success).toBe(false)
  })

  it('treats breakpoints as optional', () => {
    expect(pageDocumentSchema.safeParse(docWith(undefined)).success).toBe(true)
  })
})
