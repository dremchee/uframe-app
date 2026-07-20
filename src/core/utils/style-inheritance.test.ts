import type { PageBlock } from '@/core'
import { describe, expect, it } from 'vitest'
import { blockStyleValue, resolveInheritedStyles } from '@/core/utils/style-inheritance'

function tree(): PageBlock[] {
  return [
    {
      id: 'section',
      type: 'section',
      classes: ['hero'],
      style: { letterSpacing: '0.02em' },
      children: [
        {
          id: 'container',
          type: 'container',
          classes: ['hero-inner'],
          children: [
            { id: 'heading', type: 'heading', classes: ['title'] },
          ],
        },
      ],
    },
  ] as unknown as PageBlock[]
}

const styles = {
  'hero': { color: '#fff', fontSize: '18px' },
  'hero-inner': { fontSize: '16px' },
  'title': {},
  'hero.hero-inner': {},
}

describe('blockStyleValue', () => {
  it('prefers the local style layer over classes', () => {
    const block = { id: 'x', type: 'div', classes: ['hero'], style: { color: '#000' } } as unknown as PageBlock
    expect(blockStyleValue(block, styles, 'color')).toBe('#000')
  })

  it('falls back to the class that defines the key', () => {
    const block = { id: 'x', type: 'div', classes: ['hero'] } as unknown as PageBlock
    expect(blockStyleValue(block, styles, 'color')).toBe('#fff')
  })

  it('later-applied classes win over earlier ones', () => {
    const block = { id: 'x', type: 'div', classes: ['hero', 'hero-inner'] } as unknown as PageBlock
    expect(blockStyleValue(block, styles, 'fontSize')).toBe('16px')
  })

  it('returns undefined when nothing authored the key', () => {
    const block = { id: 'x', type: 'div', classes: ['title'] } as unknown as PageBlock
    expect(blockStyleValue(block, styles, 'fontSize')).toBeUndefined()
  })
})

describe('resolveInheritedStyles', () => {
  it('takes the nearest ancestor that authors a key', () => {
    const out = resolveInheritedStyles(tree(), styles, undefined, 'heading')
    expect(out.fontSize).toEqual({ value: '16px', from: 'container' }) // container over section
    expect(out.color).toEqual({ value: '#fff', from: 'section' })
    expect(out.letterSpacing).toEqual({ value: '0.02em', from: 'section' }) // ancestor's local layer
  })

  it('falls back to the page style as the outermost ancestor', () => {
    const out = resolveInheritedStyles(tree(), styles, { fontFamily: 'Inter' }, 'heading')
    expect(out.fontFamily).toEqual({ value: 'Inter', from: 'page' })
  })

  it('only reports keys some ancestor actually authored', () => {
    const out = resolveInheritedStyles(tree(), styles, undefined, 'heading')
    expect(out.textAlign).toBeUndefined()
    expect(out.fontFamily).toBeUndefined()
  })

  it('ignores the block\'s own values (the caller contrasts those itself)', () => {
    const blocks = tree()
    const out = resolveInheritedStyles(blocks, { ...styles, title: { color: '#f00' } }, undefined, 'heading')
    expect(out.color).toEqual({ value: '#fff', from: 'section' })
  })

  it('returns nothing for a root block without page style', () => {
    expect(resolveInheritedStyles(tree(), styles, undefined, 'section')).toEqual({})
  })
})
