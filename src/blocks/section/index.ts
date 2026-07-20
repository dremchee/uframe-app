import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { SectionBlockProps } from '@/core'
import { Layout } from '@lucide/vue'
import SectionBlock from '@/blocks/section/SectionBlock.vue'
import { sectionBlockPropsSchema } from '@/core'

export const sectionDef: VueBlockDefinition<SectionBlockProps> = {
  type: 'section',
  label: 'Section',
  description: 'Full-width semantic section',
  category: 'Structure',
  defaultProps: {},
  propsSchema: sectionBlockPropsSchema,
  renderComponent: SectionBlock,
  icon: Layout,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<section class="${ctx.classes}">${ctx.renderChildren()}</section>`
  },
}
