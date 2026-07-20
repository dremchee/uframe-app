import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, SelectBlockProps } from '@/core'
import { ChevronDownSquare } from '@lucide/vue'
import { boolAttr } from '@/blocks/registry-helpers'
import SelectBlock from '@/blocks/select/SelectBlock.vue'
import SelectSettings from '@/blocks/select/SelectSettings.vue'
import { selectBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Same plain field preset as Input, so a form reads as one family.
const selectDefaultStyle: BaseBlockStyles = {
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

export const selectDef: VueBlockDefinition<SelectBlockProps> = {
  type: 'select',
  label: 'Select',
  description: 'Dropdown',
  category: 'Forms',
  defaultProps: { name: '' },
  defaultStyle: selectDefaultStyle,
  propsSchema: selectBlockPropsSchema,
  renderComponent: SelectBlock,
  settingsComponent: SelectSettings,
  icon: ChevronDownSquare,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    const p = block.props
    const attrs = [
      ` name="${ctx.escape(p.name ?? '')}"`,
      boolAttr('required', p.required),
      boolAttr('disabled', p.disabled),
    ].join('')
    return `<select class="${ctx.classes}"${attrs}>${ctx.renderChildren()}</select>`
  },
}
