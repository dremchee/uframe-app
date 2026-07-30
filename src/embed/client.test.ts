// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createUframeEditor } from '@/embed/client'

describe('createUframeEditor', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('allows local font access in a created iframe', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    const editor = createUframeEditor({
      target,
      src: 'https://editor.example/embed',
    })

    expect(editor.iframe.getAttribute('allow')).toBe('local-fonts')
    editor.destroy()
  })

  it('preserves existing permissions when using a provided iframe', () => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('allow', 'clipboard-write')
    document.body.appendChild(iframe)

    const editor = createUframeEditor({
      target: iframe,
      src: 'https://editor.example/embed',
    })

    expect(editor.iframe.getAttribute('allow')).toBe('clipboard-write; local-fonts')
    editor.destroy()
  })
})
