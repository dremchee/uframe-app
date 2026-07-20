import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, RadioBlockProps } from '@/core'
import { CircleDot } from '@lucide/vue'
import RadioBlock from '@/blocks/radio/RadioBlock.vue'
import RadioSettings from '@/blocks/radio/RadioSettings.vue'
import { boolAttr } from '@/blocks/registry-helpers'
import { radioBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Control + caption on one centred row (mirrors Checkbox).
const radioDefaultStyle: BaseBlockStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  cursor: 'pointer',
}

export const radioDef: VueBlockDefinition<RadioBlockProps> = {
  type: 'radio',
  label: 'Radio',
  description: 'One-of-many choice',
  category: 'Forms',
  defaultProps: { name: '', label: 'Option', value: '' },
  defaultStyle: radioDefaultStyle,
  propsSchema: radioBlockPropsSchema,
  renderComponent: RadioBlock,
  settingsComponent: RadioSettings,
  icon: CircleDot,
  renderHtml(block, ctx) {
    const p = block.props
    const attrs = [
      ` type="radio"`,
      ` name="${ctx.escape(p.name ?? '')}"`,
      ` value="${ctx.escape(p.value ?? '')}"`,
      boolAttr('checked', p.checked),
      boolAttr('required', p.required),
    ].join('')
    return `<label class="${ctx.classes}"><input${attrs}><span>${ctx.escape(p.label ?? '')}</span></label>`
  },
}
