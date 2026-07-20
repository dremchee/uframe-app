import calloutCss from './callout.css?inline' // co-located CSS as a string
import './Callout.svelte' // compiling with customElement auto-defines <uf-callout-svelte>

// NOTE: targets the planned framework-neutral contract — see
// docs/plans/plugin-sdk-plan.md. Neutral fields (`element`, `settings`) are
// declared locally until the neutral SDK lands; then replace with
// `import { definePlugin, type NeutralBlockDefinition } from 'uframe'`.
interface HtmlCtx { classes: string, escape: (s: string) => string }
interface SettingsField {
  key: string
  label?: string
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color'
  options?: Array<{ label: string, value: string | number }>
}
interface NeutralBlockDefinition {
  type: string
  label: string
  category?: string
  icon?: string
  defaultProps: Record<string, unknown>
  element: string
  settings?: 'auto' | SettingsField[]
  css?: string
  renderHtml: (block: { props: Record<string, unknown> }, ctx: HtmlCtx) => string
}
interface NeutralPlugin { name: string, blocks: NeutralBlockDefinition[] }

const calloutBlock: NeutralBlockDefinition = {
  type: 'callout',
  label: 'Callout (Svelte)',
  category: 'Structure',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  defaultProps: { tone: 'info', text: 'Heads up!' },
  element: 'uf-callout-svelte',
  // Schema-driven settings — the editor renders the Content form (no Svelte).
  settings: [
    { key: 'tone', type: 'select', options: [
      { label: 'Info', value: 'info' },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Danger', value: 'danger' },
    ] },
    { key: 'text', type: 'textarea' },
  ],
  css: calloutCss, // injected once into canvas + export → renderHtml uses classes
  renderHtml(block, ctx) {
    const tone = String(block.props.tone ?? 'info')
    const text = ctx.escape(String(block.props.text ?? ''))
    return `<div class="${ctx.classes} uf-callout-block uf-callout-block--${tone}">${text}</div>`
  },
}

const plugin: NeutralPlugin = {
  name: 'callout-svelte',
  blocks: [calloutBlock],
}

export default plugin
