import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { SlotBlockProps } from '@/core'
import { PanelsTopLeft } from '@lucide/vue'
import SlotBlock from '@/blocks/slot/SlotBlock.vue'
import SlotSettings from '@/blocks/slot/SlotSettings.vue'
import { COMPONENT_SLOT_BLOCK_TYPE, slotBlockPropsSchema } from '@/core'

export const slotDef: VueBlockDefinition<SlotBlockProps> = {
  type: COMPONENT_SLOT_BLOCK_TYPE,
  label: 'Slot',
  description: 'Named component content region',
  category: 'Structure',
  availability: 'component',
  defaultProps: { name: 'content' },
  propsSchema: slotBlockPropsSchema,
  renderComponent: SlotBlock,
  settingsComponent: SlotSettings,
  icon: PanelsTopLeft,
  acceptsChildren: true,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
