// @vitest-environment jsdom
import type { BlockHtmlContext } from '@/core'
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { placeholderDef } from '@/blocks/placeholder'
import PlaceholderBlock from '@/blocks/placeholder/PlaceholderBlock.vue'
import { escapeHtml, PLACEHOLDER_KINDS, PLACEHOLDER_RATIOS } from '@/core'

const context: BlockHtmlContext = { classes: '', escape: escapeHtml, untrusted: false, renderChildren: () => '' }
const cases = PLACEHOLDER_KINDS.flatMap(kind => PLACEHOLDER_RATIOS.flatMap(ratio =>
  ['Caption <>&"', '', '   '].map(label => ({ kind, ratio, label })),
))

function parse(html: string) {
  const container = document.createElement('div')
  container.innerHTML = html
  return container.firstElementChild as HTMLElement
}

describe('placeholder canvas/export parity', () => {
  it.each(cases)('$kind / $ratio / "$label"', async (props) => {
    const canvas = parse(await renderToString(createSSRApp(PlaceholderBlock, { props })))
    const exported = parse(placeholderDef.renderHtml!({ id: 'p', type: 'placeholder', props }, context))
    expect(canvas.tagName).toBe(exported.tagName)
    expect(canvas.className).toBe(exported.className)
    expect(canvas.classList.contains(`uf-placeholder--${props.kind}`)).toBe(true)
    expect(canvas.style.aspectRatio).toBe(exported.style.aspectRatio)
    expect(canvas.style.aspectRatio).toBe(props.ratio === 'auto' ? '' : props.ratio.replace(':', ' / '))
    expect(canvas.textContent).toBe(props.label.trim())
    expect(exported.textContent).toBe(props.label.trim())
    expect(canvas.querySelectorAll('.uf-placeholder__label')).toHaveLength(props.label.trim() ? 1 : 0)
    expect(exported.querySelectorAll('.uf-placeholder__label')).toHaveLength(props.label.trim() ? 1 : 0)
  })
})
