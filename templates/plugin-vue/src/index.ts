import type { BlockDefinition, UframePlugin } from '@dremchee/uframe'
import { definePlugin } from '@dremchee/uframe'
import { h } from 'vue'
import CalloutBlock from './CalloutBlock.vue'
import calloutCss from './CalloutBlock.vue?uframe-css' // <style> lifted to a string
import CalloutSettings from './CalloutSettings.vue'
import { calloutPropsSchema } from './schema'

// The editor renders `icon` as a Vue component (`<component :is>`), so a plain
// function component works — no icon-library dependency needed.
function CalloutIcon() {
  return h('svg', { 'width': 16, 'height': 16, 'viewBox': '0 0 24 24', 'fill': 'none', 'stroke': 'currentColor', 'stroke-width': 2 }, [
    h('circle', { cx: 12, cy: 12, r: 10 }),
    h('path', { d: 'M12 16v-4M12 8h.01' }),
  ])
}

// One block definition. `renderComponent` / `settingsComponent` are Vue
// components; `renderHtml` is a framework-free string used for export/SSR.
const calloutBlock: BlockDefinition = {
  type: 'callout',
  label: 'Callout',
  description: 'Coloured note box',
  category: 'Structure',
  icon: CalloutIcon,
  defaultProps: { tone: 'info', text: 'Heads up!' },
  propsSchema: calloutPropsSchema,
  renderComponent: CalloutBlock,
  settingsComponent: CalloutSettings,
  // Block styles, injected once into the canvas + export — so renderHtml below
  // can use classes instead of inline styles (single source of truth).
  css: calloutCss,
  renderHtml(block, ctx) {
    const tone = String((block.props as { tone: string }).tone ?? 'info')
    const text = ctx.escape(String((block.props as { text: string }).text ?? ''))
    return `<div class="${ctx.classes} uf-callout-block uf-callout-block--${tone}">${text}</div>`
  },
}

// The plugin object — identical in dev (passed via `:plugins`) and prod
// (loaded from the built dist by path). This is the default export the editor
// imports at runtime.
export const calloutPlugin: UframePlugin = definePlugin({
  name: 'callout',
  blocks: [calloutBlock],
})

export default calloutPlugin
