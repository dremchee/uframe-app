import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, DividerBlockProps } from '@/core'
import { Minus as MinusIcon } from '@lucide/vue'
import DividerBlock from '@/blocks/divider/DividerBlock.vue'
import { dividerBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// A flat 1px rule instead of the browser's inset-bordered <hr>.
const dividerDefaultStyle: BaseBlockStyles = {
  height: '0',
  borderTopWidth: '1px',
  borderRightWidth: '0',
  borderBottomWidth: '0',
  borderLeftWidth: '0',
  borderStyle: 'solid',
  borderColor: '#d8dee8',
}

export const dividerDef: VueBlockDefinition<DividerBlockProps> = {
  type: 'divider',
  label: 'Divider',
  description: 'Horizontal rule',
  category: 'Structure',
  defaultProps: {},
  defaultStyle: dividerDefaultStyle,
  propsSchema: dividerBlockPropsSchema,
  renderComponent: DividerBlock,
  icon: MinusIcon,
  renderHtml(_block, ctx) {
    return `<hr class="${ctx.classes}">`
  },
}
