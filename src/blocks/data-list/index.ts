import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { DataListBlockProps } from '@/core'
import { DatabaseZap } from '@lucide/vue'
import DataListBlock from '@/blocks/data-list/DataListBlock.vue'
import { DATA_LIST_BLOCK_TYPE, dataListBlockPropsSchema } from '@/core'

export const dataListDef: VueBlockDefinition<DataListBlockProps> = {
  type: DATA_LIST_BLOCK_TYPE,
  label: 'Data List',
  description: 'Repeats its item template for each record of a collection',
  category: 'Dynamic',
  defaultProps: {},
  propsSchema: dataListBlockPropsSchema,
  renderComponent: DataListBlock,
  icon: DatabaseZap,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
