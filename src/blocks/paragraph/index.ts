import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { ParagraphBlockProps } from '@/core'
import { Pilcrow } from '@lucide/vue'
import ParagraphBlock from '@/blocks/paragraph/ParagraphBlock.vue'
import ParagraphSettings from '@/blocks/paragraph/ParagraphSettings.vue'
import { paragraphBlockPropsSchema } from '@/core'

export const paragraphDef: VueBlockDefinition<ParagraphBlockProps> = {
  type: 'paragraph',
  label: 'Paragraph',
  description: 'Plain paragraph',
  category: 'Typography',
  defaultProps: { content: 'Paragraph text.' },
  propsSchema: paragraphBlockPropsSchema,
  renderComponent: ParagraphBlock,
  settingsComponent: ParagraphSettings,
  bindableProps: ['content'],
  icon: Pilcrow,
  renderHtml(block, ctx) {
    return `<p class="${ctx.classes}">${ctx.escape(block.props.content ?? '')}</p>`
  },
}
