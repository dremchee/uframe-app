import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { ElementBlockProps } from '@/core'
import { Box as ElementIcon } from '@lucide/vue'
import ElementBlock from '@/blocks/element/ElementBlock.vue'
import ElementSettings from '@/blocks/element/ElementSettings.vue'
import { resolveElementTag } from '@/blocks/element/tag'
import { tag } from '@/blocks/registry-helpers'
import { ELEMENT_BLOCK_TYPE, elementBlockPropsSchema } from '@/core'

/**
 * The one container primitive. Section / Container / Div used to be three
 * entries that differed by rendered tag alone — the tag is a prop now, and the
 * retired types convert on load (see `BLOCK_CONVERSIONS`).
 */
export const elementDef: VueBlockDefinition<ElementBlockProps> = {
  type: ELEMENT_BLOCK_TYPE,
  label: 'Element',
  description: 'Container — choose its tag',
  category: 'Structure',
  defaultProps: { tag: 'div' },
  propsSchema: elementBlockPropsSchema,
  renderComponent: ElementBlock,
  settingsComponent: ElementSettings,
  icon: ElementIcon,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    return tag(resolveElementTag(block.props.tag), { class: ctx.classes }, ctx.renderChildren())
  },
}
