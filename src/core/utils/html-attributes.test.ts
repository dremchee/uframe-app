import { describe, expect, it } from 'vitest'
import { pageBlockSchema } from '@/core/schemas/page-document.schema'
import {
  htmlAttributeNameError,
  normalizeHtmlAttributes,
  resolveBlockHtmlAttributes,
} from '@/core/utils/html-attributes'

describe('html attributes', () => {
  it('normalizes standard, data, aria and custom attribute names', () => {
    expect(normalizeHtmlAttributes({
      ' ID ': 'hero',
      'DATA-TestId': 'hero-title',
      'aria-label': 'Hero',
      'x-analytics-key': 'landing',
      'hidden': '',
    })).toEqual({
      'id': 'hero',
      'data-testid': 'hero-title',
      'aria-label': 'Hero',
      'x-analytics-key': 'landing',
      'hidden': '',
    })
  })

  it('rejects unsafe, malformed and renderer-owned names', () => {
    expect(htmlAttributeNameError('onclick')).toBe('event-handler')
    expect(htmlAttributeNameError('onMouseDown')).toBe('event-handler')
    expect(htmlAttributeNameError('bad name')).toBe('invalid')
    expect(htmlAttributeNameError('class')).toBe('reserved')
    expect(htmlAttributeNameError('style')).toBe('reserved')
    expect(normalizeHtmlAttributes({
      onclick: 'alert(1)',
      class: 'outside',
      style: 'display:none',
      title: 'Safe',
    })).toEqual({ title: 'Safe' })
  })

  it('keeps legacy htmlId readable and lets generic id take precedence', () => {
    expect(resolveBlockHtmlAttributes({ htmlId: 'legacy' })).toEqual({ id: 'legacy' })
    expect(resolveBlockHtmlAttributes({
      htmlId: 'legacy',
      attributes: { 'id': 'current', 'data-kind': 'hero' },
    })).toEqual({ 'id': 'current', 'data-kind': 'hero' })
  })

  it('persists string-valued attribute maps in the page block schema', () => {
    expect(pageBlockSchema.safeParse({
      id: 'heading-1',
      type: 'heading',
      props: {},
      attributes: { 'data-testid': 'heading', 'hidden': '' },
    }).success).toBe(true)
    expect(pageBlockSchema.safeParse({
      id: 'heading-1',
      type: 'heading',
      props: {},
      attributes: { hidden: true },
    }).success).toBe(false)
  })
})
