import { describe, expect, it } from 'vitest'
import { renderedBoxElement } from './canvas-dom'

describe('renderedBoxElement', () => {
  it('descends through display:contents wrappers to the first box-generating child', () => {
    const box = { firstElementChild: null } as unknown as Element
    const wrapper = { firstElementChild: box } as unknown as Element
    const win = {
      getComputedStyle(element: Element) {
        return { display: element === wrapper ? 'contents' : 'block' } as CSSStyleDeclaration
      },
    } as unknown as Window

    expect(renderedBoxElement(wrapper, win)).toBe(box)
  })

  it('returns null when a contents wrapper has no rendered child', () => {
    const wrapper = { firstElementChild: null } as unknown as Element
    const win = { getComputedStyle: () => ({ display: 'contents' }) } as unknown as Window
    expect(renderedBoxElement(wrapper, win)).toBeNull()
  })
})
