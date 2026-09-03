import { describe, expect, it } from 'vitest'
import { extractVueSfcStyles } from '@/vite/uframe-css'

describe('extractVueSfcStyles', () => {
  it('extracts a plain (unscoped) SFC <style> as a CSS string', () => {
    const sfc = `
<template><div class="x">hi</div></template>
<style>
.x { color: red }
.x--big { font-size: 2rem }
</style>
`
    const css = extractVueSfcStyles(sfc, 'X.vue')
    expect(css).toContain('.x')
    expect(css).toContain('color: red')
    expect(css).toContain('.x--big')
    expect(css).toContain('font-size: 2rem')
    // No scoping attribute leaked in.
    expect(css).not.toMatch(/\[data-v-/)
  })

  it('concatenates multiple <style> blocks', () => {
    const sfc = `
<template><div /></template>
<style>.a { color: red }</style>
<style>.b { color: blue }</style>
`
    const css = extractVueSfcStyles(sfc, 'X.vue')
    expect(css).toContain('.a')
    expect(css).toContain('color: red')
    expect(css).toContain('.b')
    expect(css).toContain('color: blue')
  })

  it('returns an empty string when there is no <style>', () => {
    expect(extractVueSfcStyles('<template><div /></template>', 'X.vue')).toBe('')
  })
})
