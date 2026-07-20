import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, CheckboxBlockProps } from '@/core'
import { CheckSquare } from '@lucide/vue'
import CheckboxBlock from '@/blocks/checkbox/CheckboxBlock.vue'
import CheckboxSettings from '@/blocks/checkbox/CheckboxSettings.vue'
import { boolAttr } from '@/blocks/registry-helpers'
import { checkboxBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Control + caption on one centred row.
const checkboxDefaultStyle: BaseBlockStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  cursor: 'pointer',
}

export const checkboxDef: VueBlockDefinition<CheckboxBlockProps> = {
  type: 'checkbox',
  label: 'Checkbox',
  description: 'Toggle field',
  category: 'Forms',
  defaultProps: { name: '', label: 'Checkbox' },
  defaultStyle: checkboxDefaultStyle,
  propsSchema: checkboxBlockPropsSchema,
  renderComponent: CheckboxBlock,
  settingsComponent: CheckboxSettings,
  icon: CheckSquare,
  renderHtml(block, ctx) {
    const p = block.props
    const attrs = [
      ` type="checkbox"`,
      ` name="${ctx.escape(p.name ?? '')}"`,
      ` value="${ctx.escape(p.value ?? 'on')}"`,
      boolAttr('checked', p.checked),
      boolAttr('required', p.required),
    ].join('')
    return `<label class="${ctx.classes}"><input${attrs}><span>${ctx.escape(p.label ?? '')}</span></label>`
  },
}
