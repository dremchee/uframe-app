import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, InputBlockProps } from '@/core'
import { TextCursorInput } from '@lucide/vue'
import InputBlock from '@/blocks/input/InputBlock.vue'
import InputSettings from '@/blocks/input/InputSettings.vue'
import { boolAttr } from '@/blocks/registry-helpers'
import { inputBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// A plain usable text field; deliberately unopinionated beyond that.
const inputDefaultStyle: BaseBlockStyles = {
  width: '100%',
  paddingTop: '8px',
  paddingRight: '10px',
  paddingBottom: '8px',
  paddingLeft: '10px',
  borderTopWidth: '1px',
  borderRightWidth: '1px',
  borderBottomWidth: '1px',
  borderLeftWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#d8dee8',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  borderBottomRightRadius: '8px',
  borderBottomLeftRadius: '8px',
  backgroundColor: '#ffffff',
  fontSize: '14px',
  lineHeight: '1.4',
}

export const inputDef: VueBlockDefinition<InputBlockProps> = {
  type: 'input',
  label: 'Input',
  description: 'Single-line text input',
  category: 'Forms',
  defaultProps: { name: '', type: 'text' },
  defaultStyle: inputDefaultStyle,
  propsSchema: inputBlockPropsSchema,
  renderComponent: InputBlock,
  settingsComponent: InputSettings,
  icon: TextCursorInput,
  renderHtml(block, ctx) {
    const p = block.props
    const attrs = [
      ` type="${p.type ?? 'text'}"`,
      ` name="${ctx.escape(p.name ?? '')}"`,
      p.placeholder ? ` placeholder="${ctx.escape(p.placeholder)}"` : '',
      p.value ? ` value="${ctx.escape(p.value)}"` : '',
      boolAttr('required', p.required),
      boolAttr('disabled', p.disabled),
    ].join('')
    return `<input class="${ctx.classes}"${attrs}>`
  },
}
