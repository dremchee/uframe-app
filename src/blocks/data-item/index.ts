import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { DataItemBlockProps } from '@/core'
import { Database } from '@lucide/vue'
import DataItemBlock from '@/blocks/data-item/DataItemBlock.vue'
import { DATA_ITEM_BLOCK_TYPE, dataItemBlockPropsSchema } from '@/core'

export const dataItemDef: VueBlockDefinition<DataItemBlockProps> = {
  type: DATA_ITEM_BLOCK_TYPE,
  label: 'Data Item',
  description: 'Binds its children to a single record (singleton or relation)',
  category: 'Dynamic',
  defaultProps: {},
  propsSchema: dataItemBlockPropsSchema,
  renderComponent: DataItemBlock,
  icon: Database,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
