import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, LabelBlockProps } from '@/core'
import { TagIcon } from '@lucide/vue'
import LabelBlock from '@/blocks/label/LabelBlock.vue'
import LabelSettings from '@/blocks/label/LabelSettings.vue'
import { labelBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Slightly smaller than body text, on its own line by default.
const labelDefaultStyle: BaseBlockStyles = {
  display: 'inline-block',
  fontSize: '13px',
}

export const labelDef: VueBlockDefinition<LabelBlockProps> = {
  type: 'label',
  label: 'Label',
  description: 'Field label',
  category: 'Forms',
  defaultProps: { text: 'Label' },
  defaultStyle: labelDefaultStyle,
  propsSchema: labelBlockPropsSchema,
  renderComponent: LabelBlock,
  settingsComponent: LabelSettings,
  icon: TagIcon,
  renderHtml(block, ctx) {
    const forAttr = block.props.for ? ` for="${ctx.escape(block.props.for)}"` : ''
    return `<label class="${ctx.classes}"${forAttr}>${ctx.escape(block.props.text ?? '')}</label>`
  },
}
