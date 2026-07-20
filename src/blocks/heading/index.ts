import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { HeadingBlockProps } from '@/core'
import { Heading } from '@lucide/vue'
import HeadingBlock from '@/blocks/heading/HeadingBlock.vue'
import HeadingSettings from '@/blocks/heading/HeadingSettings.vue'
import { headingBlockPropsSchema } from '@/core'

export const headingDef: VueBlockDefinition<HeadingBlockProps> = {
  type: 'heading',
  label: 'Heading',
  description: 'Section title',
  category: 'Typography',
  defaultProps: { content: 'New heading', level: 2 },
  propsSchema: headingBlockPropsSchema,
  renderComponent: HeadingBlock,
  settingsComponent: HeadingSettings,
  bindableProps: ['content'],
  icon: Heading,
  renderHtml(block, ctx) {
    const tag = `h${block.props.level ?? 2}`
    return `<${tag} class="${ctx.classes}">${ctx.escape(block.props.content ?? '')}</${tag}>`
  },
}
