import type { Component } from 'vue'
import type { DataItemBlockProps, DataListBlockProps } from './types'
import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import { Database, DatabaseZap } from '@lucide/vue'
import { z } from 'zod'
import { definePlugin } from '@/core/utils/plugin'
import DataItemBlock from './DataItemBlock.vue'
import DataListBlock from './DataListBlock.vue'
import DataSourceSettings from './DataSourceSettings.vue'
import { DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE } from './types'

const emptyPropsSchema = z.object({})

const dataListDef: VueBlockDefinition<DataListBlockProps> = {
  type: DATA_LIST_BLOCK_TYPE,
  label: 'Data List',
  description: 'Repeats its item template for each record of a collection',
  category: 'Dynamic',
  defaultProps: {},
  propsSchema: emptyPropsSchema,
  renderComponent: DataListBlock,
  settingsComponent: DataSourceSettings,
  icon: DatabaseZap,
  acceptsChildren: true,
  renderHtml: (_block, ctx) => `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`,
}

const dataItemDef: VueBlockDefinition<DataItemBlockProps> = {
  type: DATA_ITEM_BLOCK_TYPE,
  label: 'Data Item',
  description: 'Binds its children to a single record (singleton or relation)',
  category: 'Dynamic',
  defaultProps: {},
  propsSchema: emptyPropsSchema,
  renderComponent: DataItemBlock,
  settingsComponent: DataSourceSettings,
  icon: Database,
  acceptsChildren: true,
  renderHtml: (_block, ctx) => `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`,
}

/** Optional first-party plugin for CMS-backed list, item and binding workflows. */
export const dataPlugin = definePlugin<Component>({
  name: 'data',
  blocks: [dataListDef, dataItemDef] as unknown as ReturnType<typeof definePlugin<Component>>['blocks'],
})

export default dataPlugin
export * from './data'
export * from './resolve'
export * from './types'
