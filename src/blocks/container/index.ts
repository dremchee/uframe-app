import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { ContainerBlockProps } from '@/core'
import { Box } from '@lucide/vue'
import ContainerBlock from '@/blocks/container/ContainerBlock.vue'
import { containerBlockPropsSchema } from '@/core'

export const containerDef: VueBlockDefinition<ContainerBlockProps> = {
  type: 'container',
  label: 'Container',
  description: 'Generic flex container',
  category: 'Structure',
  defaultProps: {},
  propsSchema: containerBlockPropsSchema,
  renderComponent: ContainerBlock,
  icon: Box,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
