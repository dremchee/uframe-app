import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { SpacerBlockProps } from '@/core'
import { MoveVertical } from '@lucide/vue'
import SpacerBlock from '@/blocks/spacer/SpacerBlock.vue'
import SpacerSettings from '@/blocks/spacer/SpacerSettings.vue'
import { spacerBlockPropsSchema } from '@/core'

export const spacerDef: VueBlockDefinition<SpacerBlockProps> = {
  type: 'spacer',
  label: 'Spacer',
  description: 'Vertical rhythm',
  category: 'Structure',
  defaultProps: { height: 40 },
  propsSchema: spacerBlockPropsSchema,
  renderComponent: SpacerBlock,
  settingsComponent: SpacerSettings,
  icon: MoveVertical,
  renderHtml(block, ctx) {
    return `<div class="${ctx.classes}" style="height: ${Number(block.props.height) || 0}px"></div>`
  },
}
