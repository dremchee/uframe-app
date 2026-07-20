import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { EmbedBlockProps } from '@/core'
import { Code } from '@lucide/vue'
import EmbedBlock from '@/blocks/embed/EmbedBlock.vue'
import EmbedSettings from '@/blocks/embed/EmbedSettings.vue'
import { embedBlockPropsSchema } from '@/core'

export const embedDef: VueBlockDefinition<EmbedBlockProps> = {
  type: 'embed',
  label: 'Embed',
  description: 'Custom HTML / iframe / SVG',
  category: 'Media',
  defaultProps: { html: '' },
  propsSchema: embedBlockPropsSchema,
  renderComponent: EmbedBlock,
  settingsComponent: EmbedSettings,
  icon: Code,
  renderHtml(block, ctx) {
    const html = block.props.html ?? ''
    // Untrusted document: isolate the author HTML in a sandboxed, cross-origin
    // iframe (no allow-same-origin) instead of inlining it. The sandbox iframe
    // can't auto-size to its content, so its default box is inlined — exported
    // markup carries no service classes to hang a rule on.
    if (ctx.untrusted && html)
      return `<div class="${ctx.classes}"><iframe style="display: block; width: 100%; min-height: 240px; border: 0" sandbox="allow-scripts allow-popups allow-forms" srcdoc="${ctx.escape(html)}"></iframe></div>`
    // Trust boundary: editor-authored HTML, emitted verbatim.
    return `<div class="${ctx.classes}">${html}</div>`
  },
}
