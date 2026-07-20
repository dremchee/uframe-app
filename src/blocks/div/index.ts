import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { DivBlockProps } from '@/core'
import { Square } from '@lucide/vue'
import DivBlock from '@/blocks/div/DivBlock.vue'
import { divBlockPropsSchema } from '@/core'

export const divDef: VueBlockDefinition<DivBlockProps> = {
  type: 'div',
  label: 'Div Block',
  description: 'Neutral container',
  category: 'Basic',
  defaultProps: {},
  propsSchema: divBlockPropsSchema,
  renderComponent: DivBlock,
  icon: Square,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
