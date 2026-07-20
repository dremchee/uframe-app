import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, ButtonBlockProps } from '@/core'
import { MousePointerClick } from '@lucide/vue'
import ButtonBlock from '@/blocks/button/ButtonBlock.vue'
import ButtonSettings from '@/blocks/button/ButtonSettings.vue'
import { buttonBlockPropsSchema } from '@/core'

// Default look lives in editable block styles (a "primary" preset), not in
// hardcoded CSS — so the user owns every aspect via the Style tab.
const buttonDefaultStyle: BaseBlockStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '8px',
  paddingRight: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  backgroundColor: '#0f766e',
  color: '#ffffff',
  borderTopLeftRadius: '6px',
  borderTopRightRadius: '6px',
  borderBottomRightRadius: '6px',
  borderBottomLeftRadius: '6px',
  fontWeight: 600,
  fontSize: '14px',
  textDecoration: 'none',
  cursor: 'pointer',
}

export const buttonDef: VueBlockDefinition<ButtonBlockProps> = {
  type: 'button',
  label: 'Button',
  description: 'Call to action',
  category: 'Basic',
  defaultProps: { label: 'Open link', href: '#' },
  defaultStyle: buttonDefaultStyle,
  propsSchema: buttonBlockPropsSchema,
  renderComponent: ButtonBlock,
  settingsComponent: ButtonSettings,
  icon: MousePointerClick,
  renderHtml(block, ctx) {
    const kind = block.props.kind ?? 'link'
    const label = ctx.escape(block.props.label ?? '')
    if (kind === 'link')
      return `<a class="${ctx.classes}" href="${ctx.escape(block.props.href ?? '#')}">${label}</a>`
    return `<button class="${ctx.classes}" type="${kind}">${label}</button>`
  },
}
