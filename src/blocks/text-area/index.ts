import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, TextAreaBlockProps } from '@/core'
import { TextCursorInput } from '@lucide/vue'
import { boolAttr } from '@/blocks/registry-helpers'
import TextAreaBlock from '@/blocks/text-area/TextAreaBlock.vue'
import TextAreaSettings from '@/blocks/text-area/TextAreaSettings.vue'
import { textAreaBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Same plain field preset as Input, so a form reads as one family.
const textAreaDefaultStyle: BaseBlockStyles = {
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

export const textAreaDef: VueBlockDefinition<TextAreaBlockProps> = {
  type: 'text-area',
  label: 'Text Area',
  description: 'Multi-line input',
  category: 'Forms',
  defaultProps: { name: '', rows: 4 },
  defaultStyle: textAreaDefaultStyle,
  propsSchema: textAreaBlockPropsSchema,
  renderComponent: TextAreaBlock,
  settingsComponent: TextAreaSettings,
  icon: TextCursorInput,
  renderHtml(block, ctx) {
    const p = block.props
    const attrs = [
      ` name="${ctx.escape(p.name ?? '')}"`,
      p.placeholder ? ` placeholder="${ctx.escape(p.placeholder)}"` : '',
      ` rows="${p.rows ?? 4}"`,
      boolAttr('required', p.required),
      boolAttr('disabled', p.disabled),
    ].join('')
    return `<textarea class="${ctx.classes}"${attrs}></textarea>`
  },
}
