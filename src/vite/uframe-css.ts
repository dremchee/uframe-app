import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { compileStyle, parse } from '@vue/compiler-sfc'

// Lets plugin authors keep block styles INSIDE the component (`<style>` in a Vue
// SFC / Svelte file) and import them as a string for the block definition's
// `css` field:
//
//   import css from './CalloutBlock.vue?uframe-css'
//   // → css: css   (editor injects it into the canvas iframe + export)
//
// Why a build step is needed: a component's `<style>` is injected by the bundler
// into the main document head (or a shadow root) and never reaches the canvas
// iframe or the runtime-less export string. This lifts it out as plain CSS.
//
// Author the `<style>` WITHOUT `scoped` — scoped adds `[data-v-…]` selectors that
// won't match the classes emitted by renderHtml.

const SUFFIX = '?uframe-css'

/** Compile a Vue SFC's `<style>` blocks to a single plain CSS string (unscoped). */
export function extractVueSfcStyles(source: string, filename: string): string {
  const { descriptor } = parse(source, { filename })
  return descriptor.styles
    .map(style => compileStyle({
      source: style.content,
      filename,
      id: 'uframe',
      scoped: false,
      preprocessLang: style.lang as undefined,
    }).code)
    .join('\n')
    .trim()
}

interface SvelteCompiler {
  compile: (source: string, options: { filename: string, css: string }) => { css?: { code: string } }
}

/** Compile a Svelte component's `<style>` to a plain CSS string. */
async function extractSvelteStyles(source: string, filename: string): Promise<string> {
  // Lazy + indirect import: svelte is only a dependency of Svelte plugin
  // projects, so it's resolved at runtime there (the specifier is a variable so
  // TS doesn't try to resolve the module in this package).
  const specifier = 'svelte/compiler'
  const { compile } = await import(specifier) as SvelteCompiler
  const result = compile(source, { filename, css: 'external' })
  return result.css?.code?.trim() ?? ''
}

export function uframeCss(): Plugin {
  return {
    name: 'uframe-css',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!id.endsWith(SUFFIX))
        return
      const base = id.slice(0, -SUFFIX.length)
      if (isAbsolute(base))
        return id
      if (importer)
        return `${resolve(dirname(importer), base)}${SUFFIX}`
    },
    async load(id) {
      if (!id.endsWith(SUFFIX))
        return
      const file = id.slice(0, -SUFFIX.length)
      const source = readFileSync(file, 'utf8')
      let css = ''
      if (file.endsWith('.vue'))
        css = extractVueSfcStyles(source, file)
      else if (file.endsWith('.svelte'))
        css = await extractSvelteStyles(source, file)
      return { code: `export default ${JSON.stringify(css)}`, map: null }
    },
  }
}
