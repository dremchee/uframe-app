import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { TextBlockProps } from '@/core'
import { Type } from '@lucide/vue'
import TextBlock from '@/blocks/text/TextBlock.vue'
import TextSettings from '@/blocks/text/TextSettings.vue'
import { textBlockPropsSchema } from '@/core'

export const textDef: VueBlockDefinition<TextBlockProps> = {
  type: 'text',
  label: 'Text',
  description: 'Plain text copy',
  category: 'Typography',
  defaultProps: { content: 'Start writing your content.' },
  propsSchema: textBlockPropsSchema,
  renderComponent: TextBlock,
  settingsComponent: TextSettings,
  bindableProps: ['content'],
  icon: Type,
  renderHtml(block, ctx) {
    // Plain text now (rich-text editor removed): escape, then keep line breaks.
    const content = ctx.escape(block.props.content ?? '').replace(/\n/g, '<br>')
    return `<div class="${ctx.classes}" style="white-space:pre-wrap">${content}</div>`
  },
}
