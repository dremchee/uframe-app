import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BoxBlockProps } from '@/core'
import { Box as BoxIcon } from '@lucide/vue'
import BoxBlock from '@/blocks/box/BoxBlock.vue'
import BoxSettings from '@/blocks/box/BoxSettings.vue'
import { resolveBoxTag } from '@/blocks/box/tag'
import { tag } from '@/blocks/registry-helpers'
import { BOX_BLOCK_TYPE, boxBlockPropsSchema } from '@/core'

/**
 * The one container primitive. Section / Container / Div used to be three
 * entries that differed by rendered tag alone — the tag is a prop now, and the
 * retired types convert on load (see `BLOCK_CONVERSIONS`).
 */
export const boxDef: VueBlockDefinition<BoxBlockProps> = {
  type: BOX_BLOCK_TYPE,
  label: 'Box',
  description: 'Container — choose its tag',
  category: 'Structure',
  defaultProps: { tag: 'div' },
  propsSchema: boxBlockPropsSchema,
  renderComponent: BoxBlock,
  settingsComponent: BoxSettings,
  icon: BoxIcon,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    return tag(resolveBoxTag(block.props.tag), { class: ctx.classes }, ctx.renderChildren())
  },
}
