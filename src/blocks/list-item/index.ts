import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { ListItemBlockProps } from '@/core'
import { ListPlus } from '@lucide/vue'
import ListItemBlock from '@/blocks/list-item/ListItemBlock.vue'
import { listItemBlockPropsSchema } from '@/core'

export const listItemDef: VueBlockDefinition<ListItemBlockProps> = {
  type: 'list-item',
  label: 'List Item',
  description: 'List entry',
  category: 'Typography',
  defaultProps: {},
  propsSchema: listItemBlockPropsSchema,
  renderComponent: ListItemBlock,
  icon: ListPlus,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<li class="${ctx.classes}">${ctx.renderChildren()}</li>`
  },
}
