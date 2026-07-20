import type { PageDocument } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { sanitizeCssValue } from '@/core/utils/css'
import { serializeVariables } from '@/core/utils/css-variables'
import { serializeStyleDeclarations } from '@/core/utils/style-serialization'
import {
  blockClassName,
  classKeyApplies,
  comboSelector,
  composeGap,
  gapAxis,
  isComboKey,
  isSplitGap,
  nameUnnamedStyles,
  normalizeComboKey,
  normalizeSimpleClassNames,
  parseClassKey,
  sanitizeClassName,
  serializeBlockTreeStyles,
  serializeClassStyles,
  serializeDocumentStyles,
  styleClassName,
} from '@/core/utils/styles'

describe('serializeStyleDeclarations', () => {
  it('returns an empty string for undefined or empty input', () => {
    expect(serializeStyleDeclarations(undefined)).toBe('')
    expect(serializeStyleDeclarations({})).toBe('')
  })

  it('kebab-cases camelCase keys', () => {
    expect(serializeStyleDeclarations({
      paddingTop: '16px',
      backgroundColor: '#fff',
      borderTopLeftRadius: '4px',
    })).toBe('padding-top: 16px; background-color: #fff; border-top-left-radius: 4px')
  })

  it('serializes cornerShape to the corner-shape property', () => {
    expect(serializeStyleDeclarations({
      borderTopLeftRadius: '12px',
      cornerShape: 'squircle',
    })).toBe('border-top-left-radius: 12px; corner-shape: squircle')
  })

  it('serializes side-specific border styles and colors', () => {
    expect(serializeStyleDeclarations({
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'var(--border)',
    })).toBe('border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: var(--border)')
  })

  it('skips empty / null / undefined values', () => {
    expect(serializeStyleDeclarations({
      color: '',
      fontFamily: undefined,
      backgroundColor: '#000',
    })).toBe('background-color: #000')
  })

  it('collapses structured filter / backdrop-filter stacks to CSS (skipping disabled)', () => {
    expect(serializeStyleDeclarations({
      filter: [
        { id: 'a', type: 'blur', enabled: true, amount: 5 },
        { id: 'b', type: 'grayscale', enabled: false, amount: 100 },
        { id: 'c', type: 'hue-rotate', enabled: true, amount: 180 },
      ],
    })).toBe('filter: blur(5px) hue-rotate(180deg)')

    // backdrop-filter also emits the -webkit- prefix, before the unprefixed prop.
    expect(serializeStyleDeclarations({
      backdropFilter: [
        { id: 'a', type: 'saturate', enabled: true, amount: 200 },
        { id: 'b', type: 'drop-shadow', enabled: true, x: 0, y: 2, blur: 5, color: 'rgba(0, 0, 0, 0.7)' },
      ],
    })).toBe('-webkit-backdrop-filter: saturate(200%) drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.7)); backdrop-filter: saturate(200%) drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.7))')

    // An empty / all-disabled stack emits nothing.
    expect(serializeStyleDeclarations({ filter: [] })).toBe('')
    expect(serializeStyleDeclarations({
      filter: [{ id: 'a', type: 'blur', enabled: false, amount: 5 }],
    })).toBe('')
  })

  it('collapses structured box-shadow stacks to CSS (inset + multiple layers)', () => {
    expect(serializeStyleDeclarations({
      boxShadow: [
        { id: 'a', enabled: true, inset: false, x: 0, y: 2, blur: 5, spread: 0, color: 'rgba(0, 0, 0, 0.2)' },
        { id: 'b', enabled: true, inset: true, x: 0, y: 1, blur: 2, spread: 1, color: '#000' },
        { id: 'c', enabled: false, inset: false, x: 0, y: 0, blur: 0, spread: 0, color: '#fff' },
      ],
    })).toBe('box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.2), inset 0px 1px 2px 1px #000')
  })

  it('ignores nested keys (states, responsive)', () => {
    expect(serializeStyleDeclarations({
      color: '#000',
      states: { hover: { color: '#f00' } },
      responsive: { tablet: { color: '#0f0' } },
    } as never)).toBe('color: #000')
  })
})

describe('blockClassName / styleClassName', () => {
  it('prefixes with uf-block-', () => {
    expect(blockClassName('hero')).toBe('uf-block-hero')
  })

  it('keeps underscores and dashes, replaces other punctuation', () => {
    expect(blockClassName('hero_section')).toBe('uf-block-hero_section')
    expect(blockClassName('a.b/c')).toBe('uf-block-a_b_c')
  })

  it('styleClassName emits user-authored names verbatim', () => {
    expect(styleClassName('primary-button')).toBe('primary-button')
    expect(styleClassName('a b c')).toBe('a_b_c')
  })

  it('styleClassName falls back to the legacy prefix for legacy/reserved names', () => {
    // Invalid identifier start — `.2col` would not parse as a selector.
    expect(styleClassName('2col')).toBe('uf-cls-2col')
    expect(styleClassName('-2x')).toBe('uf-cls--2x')
    // Reserved structural namespace.
    expect(styleClassName('uf-card')).toBe('uf-cls-uf-card')
  })
})

describe('nameUnnamedStyles', () => {
  it('lifts local styles into a class named after a readable block id', () => {
    const result = nameUnnamedStyles(
      [{ id: 'lp-hero', type: 'section', props: {}, style: { color: '#000' } }],
      undefined,
      {},
    )
    expect(result.changed).toBe(true)
    expect(result.styles['lp-hero']).toEqual({ color: '#000' })
    expect(result.blocks[0]!.classes).toEqual(['lp-hero'])
    expect(result.blocks[0]!.style).toBeUndefined()
  })

  it('names generated ids from the block type, counting up on collision', () => {
    const result = nameUnnamedStyles(
      [
        { id: 'section_5fb6942d', type: 'section', props: {}, style: { color: '#000' } },
        { id: 'section_96eb4cc2', type: 'section', props: {}, style: { color: '#fff' } },
        // Legacy full-uuid ids read as generated too.
        { id: 'section_5fb6942d-96eb-4cc2-b018-853905820b32', type: 'section', props: {}, style: { color: '#111' } },
      ],
      undefined,
      {},
    )
    expect(result.blocks.map(b => b.classes)).toEqual([['section'], ['section-2'], ['section-3']])
    expect(result.styles.section).toEqual({ color: '#000' })
    expect(result.styles['section-2']).toEqual({ color: '#fff' })
    expect(result.styles['section-3']).toEqual({ color: '#111' })
  })

  it('suffixes when the name is taken in the styles map or the reserved set', () => {
    const result = nameUnnamedStyles(
      [{ id: 'hero', type: 'section', props: {}, style: { color: '#000' } }],
      undefined,
      { hero: {} },
      { 'hero-2': {} },
    )
    expect(result.blocks[0]!.classes).toEqual(['hero-3'])
    expect(result.styles['hero-3']).toEqual({ color: '#000' })
  })

  it('walks children and symbol masters, keeping untouched nodes by reference', () => {
    const plain = { id: 'plain', type: 'text', props: {} }
    const result = nameUnnamedStyles(
      [{
        id: 'wrap',
        type: 'div',
        props: {},
        children: [plain, { id: 'kid', type: 'heading', props: {}, style: { color: '#000' } }],
      }],
      {
        s1: {
          id: 's1',
          name: 'Header',
          updatedAt: '',
          root: { id: 'sym-header', type: 'div', props: {}, style: { color: '#fff' } },
          variants: [{ id: 'default', name: 'Default', classes: [] }],
          defaultVariantId: 'default',
        },
      },
      {},
    )
    expect(result.blocks[0]!.children![0]).toBe(plain)
    expect(result.blocks[0]!.children![1]!.classes).toEqual(['kid'])
    expect(result.symbols!.s1!.root.classes).toEqual(['sym-header'])
    expect(result.styles['sym-header']).toEqual({ color: '#fff' })
  })

  it('is idempotent — a normalized tree comes back unchanged', () => {
    const first = nameUnnamedStyles(
      [{ id: 'lp-hero', type: 'section', props: {}, style: { color: '#000' } }],
      undefined,
      {},
    )
    const second = nameUnnamedStyles(first.blocks, first.symbols, first.styles)
    expect(second.changed).toBe(false)
    expect(second.blocks[0]).toBe(first.blocks[0])
  })
})

describe('sanitizeClassName', () => {
  it('lowercases, collapses whitespace and strips foreign characters', () => {
    expect(sanitizeClassName('Primary Button')).toBe('primary-button')
    expect(sanitizeClassName('  card  ')).toBe('card')
    expect(sanitizeClassName('кнопка!btn')).toBe('btn')
  })

  it('rejects names that cannot start a CSS identifier', () => {
    expect(sanitizeClassName('2col')).toBe('')
    expect(sanitizeClassName('-dash')).toBe('')
    expect(sanitizeClassName('')).toBe('')
  })

  it('rejects the reserved uf- namespace', () => {
    expect(sanitizeClassName('uf-card')).toBe('')
    expect(sanitizeClassName('UF-Card')).toBe('')
  })
})

describe('serializeBlockTreeStyles', () => {
  it('emits rules for blocks with styles, skips empty ones', () => {
    const css = serializeBlockTreeStyles([
      { id: 'a', type: 'heading', props: {}, style: { color: '#000' } },
      { id: 'b', type: 'text', props: {} },
      {
        id: 'c',
        type: 'container',
        props: {},
        style: { padding: '8px' } as never,
        children: [
          { id: 'cc', type: 'heading', props: {}, style: { fontSize: '14px' } },
        ],
      },
    ])
    expect(css).toBe([
      '.uf-block-a { color: #000 }',
      '.uf-block-c { padding: 8px }',
      '.uf-block-cc { font-size: 14px }',
    ].join('\n'))
  })

  it('emits :hover/:focus/:active state rules', () => {
    const css = serializeBlockTreeStyles([
      {
        id: 'btn',
        type: 'button',
        props: {},
        style: {
          color: '#fff',
          states: { hover: { color: '#000' }, focus: { backgroundColor: '#eee' } },
        },
      },
    ])
    expect(css).toContain('.uf-block-btn { color: #fff }')
    expect(css).toContain('.uf-block-btn:hover { color: #000 }')
    expect(css).toContain('.uf-block-btn:focus { background-color: #eee }')
  })

  it('wraps responsive overrides in @media range syntax', () => {
    const css = serializeBlockTreeStyles([
      {
        id: 'h',
        type: 'heading',
        props: {},
        style: {
          responsive: {
            tablet: { fontSize: '24px' },
            mobile: { fontSize: '18px' },
          },
        },
      },
    ])
    expect(css).toContain('@media (width <= 1024px) { .uf-block-h { font-size: 24px } }')
    expect(css).toContain('@media (width <= 768px) { .uf-block-h { font-size: 18px } }')
  })
})

describe('serializeClassStyles', () => {
  it('emits per-class rules (and pseudo / responsive variants)', () => {
    const css = serializeClassStyles({
      'primary-button': {
        backgroundColor: '#0f766e',
        states: { hover: { backgroundColor: '#115e59' } },
      },
    })
    expect(css).toContain('.primary-button { background-color: #0f766e }')
    expect(css).toContain('.primary-button:hover { background-color: #115e59 }')
  })

  it('returns empty string when styles map is undefined/empty', () => {
    expect(serializeClassStyles(undefined)).toBe('')
    expect(serializeClassStyles({})).toBe('')
  })
})

describe('combo key helpers', () => {
  it('parseClassKey splits on dots and filters empties', () => {
    expect(parseClassKey('button')).toEqual(['button'])
    expect(parseClassKey('button.primary')).toEqual(['button', 'primary'])
    expect(parseClassKey('a..b')).toEqual(['a', 'b'])
  })

  it('checks whether every selector part is applied to a block', () => {
    expect(classKeyApplies('button.primary', ['button', 'primary'])).toBe(true)
    expect(classKeyApplies('button.primary', new Set(['button']))).toBe(false)
  })

  it('isComboKey is true only when key contains a dot', () => {
    expect(isComboKey('button')).toBe(false)
    expect(isComboKey('button.primary')).toBe(true)
  })

  it('normalizeComboKey sorts and de-duplicates parts', () => {
    expect(normalizeComboKey(['primary', 'button'])).toBe('button.primary')
    expect(normalizeComboKey(['a', 'b', 'a'])).toBe('a.b')
    expect(normalizeComboKey(['c', 'a', 'b'])).toBe('a.b.c')
  })

  it('normalizes simple class names without changing their order', () => {
    expect(normalizeSimpleClassNames(['card', 'card.primary', 'card', '', 'featured'])).toEqual(['card', 'featured'])
  })

  it('comboSelector chains styleClassName selectors', () => {
    expect(comboSelector(['button', 'primary'])).toBe('.button.primary')
  })
})

describe('serializeClassStyles with combos', () => {
  it('emits chained selectors for combo keys', () => {
    const css = serializeClassStyles({
      'button.primary': { backgroundColor: '#0f766e' },
    })
    expect(css).toContain('.button.primary { background-color: #0f766e }')
  })

  it('emits single-class rules before combo rules', () => {
    const css = serializeClassStyles({
      'button.primary': { backgroundColor: '#0f766e' },
      'button': { paddingTop: '12px' },
    })
    expect(css.indexOf('.button {')).toBeLessThan(css.indexOf('.button.primary'))
  })

  it('orders combos by chain length so longer wins by source order on tie', () => {
    const css = serializeClassStyles({
      'a.b.c': { color: 'red' },
      'a.b': { color: 'blue' },
    })
    const lines = css.split('\n')
    expect(lines[0]).toContain('.a.b ')
    expect(lines[1]).toContain('.a.b.c')
  })

  it('combo rules support states and responsive overrides', () => {
    const css = serializeClassStyles({
      'btn.danger': {
        color: '#fff',
        states: { hover: { color: '#fee' } },
        responsive: { mobile: { fontSize: '12px' } },
      },
    })
    expect(css).toContain('.btn.danger { color: #fff }')
    expect(css).toContain('.btn.danger:hover { color: #fee }')
    expect(css).toContain('@media (width <= 768px) { .btn.danger { font-size: 12px } }')
  })

  it('combos sort deterministically among equal-length chains', () => {
    const css = serializeClassStyles({
      'b.a': { color: 'red' },
      'a.b': { color: 'blue' },
    })
    // Both keys normalize to the same selector, both rules emit — last writer
    // wins by source order, so both rules show up.
    const occurrences = css.split('.a.b').length - 1
    expect(occurrences).toBe(2)
  })
})

describe('serializeDocumentStyles (full pipeline)', () => {
  function makeDoc(): PageDocument {
    return {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff', style: { color: '#222' } },
      styles: { hero: { fontSize: '48px' } },
      blocks: [
        {
          id: 'h',
          type: 'heading',
          props: {},
          classes: ['hero'],
          style: { fontWeight: 700 },
        },
      ],
    }
  }

  it('emits body, class and block rules in cascade order', () => {
    const css = serializeDocumentStyles(makeDoc())
    const lines = css.split('\n')
    expect(lines[0]).toBe('body { color: #222 }')
    // class rule comes before block rule so per-block overrides win on equal specificity by source order.
    expect(css.indexOf('.hero')).toBeLessThan(css.indexOf('.uf-block-h'))
    expect(css).toContain('.hero { font-size: 48px }')
    expect(css).toContain('.uf-block-h { font-weight: 700 }')
  })

  it('omits empty layers', () => {
    const doc = makeDoc()
    doc.settings = { width: 'responsive', background: '#fff' }
    doc.styles = undefined
    doc.blocks = []
    expect(serializeDocumentStyles(doc)).toBe('')
  })

  it('emits one rule per block id; document.blocks wins over a stale symbol copy', () => {
    // Mirrors symbol-edit: the live root is in document.blocks while the
    // stored copy (same id) still sits in document.symbols.
    const doc: PageDocument = {
      id: 'p',
      title: 'p',
      version: 1,
      updatedAt: '',
      settings: { width: 'responsive', background: '#fff' },
      blocks: [{ id: 'root', type: 'section', props: {}, style: { backgroundColor: '#001122' } }],
      symbols: {
        sym: {
          id: 'sym',
          name: 'S',
          updatedAt: '',
          root: { id: 'root', type: 'section', props: {}, style: { backgroundColor: '#999999' } },
          variants: [{ id: 'default', name: 'Default', classes: [] }],
          defaultVariantId: 'default',
        },
      },
    }
    const css = serializeDocumentStyles(doc)
    expect(css).toContain('.uf-block-root { background-color: #001122 }')
    expect(css).not.toContain('#999999')
    expect(css.match(/\.uf-block-root\b/g)?.length).toBe(1)
  })
})

describe('sanitizeCssValue', () => {
  it('strips characters that break out of a declaration, rule or <style>', () => {
    expect(sanitizeCssValue('red; } body { display:none')).toBe('red body display:none')
    expect(sanitizeCssValue('x</style><script>')).toBe('x/stylescript') // no < > survive
    expect(sanitizeCssValue('a{b}c')).toBe('abc')
  })
  it('collapses whitespace/newlines and trims', () => {
    expect(sanitizeCssValue('  1px\n  solid  ')).toBe('1px solid')
  })
  it('leaves ordinary values untouched', () => {
    expect(sanitizeCssValue('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)')
    expect(sanitizeCssValue('1rem 5%')).toBe('1rem 5%')
  })
})

describe('serializeStyleDeclarations — injection hardening', () => {
  it('neutralises a stylesheet-breakout payload in a free-form value', () => {
    const css = serializeStyleDeclarations({ color: 'red; } body { display:none } .x{a:b' } as any)
    expect(css).not.toContain('}')
    expect(css).not.toContain(';')
    expect(css).not.toContain('{')
  })
  it('strips `</style>` breakout characters from a value', () => {
    const css = serializeStyleDeclarations({ fontFamily: 'x</style><img src=x onerror=alert(1)>' } as any)
    expect(css).not.toContain('<')
    expect(css).not.toContain('>')
  })
})

describe('serializeVariables — injection hardening', () => {
  it('strips breakout characters from a variable value', () => {
    const css = serializeVariables([{ key: 'brand', value: 'red } body { display:none', name: 'brand' } as any])
    expect(css).toContain('--brand:')
    // Only the `:root { … }` wrapper braces remain; the injected rule is gone.
    expect(css.match(/\{/g)?.length).toBe(1)
    expect(css.match(/\}/g)?.length).toBe(1)
  })
})

describe('composeGap', () => {
  it('clears when both axes are blank', () => {
    expect(composeGap('', '')).toBeUndefined()
  })
  it('emits a single value when the axes match', () => {
    expect(composeGap('12px', '12px')).toBe('12px')
    expect(composeGap('2rem', '2rem')).toBe('2rem')
  })
  it('emits `<row> <column>` when the axes differ', () => {
    expect(composeGap('24px', '29px')).toBe('24px 29px')
  })
  it('preserves mixed units (not px-only)', () => {
    expect(composeGap('1rem', '5%')).toBe('1rem 5%')
  })
  it('falls back to a unitless 0 for a blank axis when the other is set', () => {
    expect(composeGap('', '29px')).toBe('0 29px')
    expect(composeGap('24px', '')).toBe('24px 0')
  })
  it('keeps the two-token form for equal axes when split (the unlock state)', () => {
    expect(composeGap('12px', '12px', true)).toBe('12px 12px')
  })
  it('still clears when both axes are blank, even when split', () => {
    expect(composeGap('', '', true)).toBeUndefined()
  })
})

describe('isSplitGap', () => {
  it('a single-token gap (or nothing) is linked', () => {
    expect(isSplitGap({ gap: '12px' })).toBe(false)
    expect(isSplitGap({})).toBe(false)
    expect(isSplitGap(undefined)).toBe(false)
  })
  it('a two-token gap is split — equal values included', () => {
    expect(isSplitGap({ gap: '24px 29px' })).toBe(true)
    expect(isSplitGap({ gap: '12px 12px' })).toBe(true)
  })
})

describe('gapAxis', () => {
  it('reads a single-value shorthand as both axes', () => {
    expect(gapAxis({ gap: '12px' }, 'row')).toBe('12px')
    expect(gapAxis({ gap: '12px' }, 'column')).toBe('12px')
  })
  it('splits `<row> <column>` correctly', () => {
    expect(gapAxis({ gap: '24px 29px' }, 'row')).toBe('24px')
    expect(gapAxis({ gap: '24px 29px' }, 'column')).toBe('29px')
  })
  it('returns empty when nothing is set', () => {
    expect(gapAxis(undefined, 'row')).toBe('')
    expect(gapAxis({}, 'column')).toBe('')
  })
})
