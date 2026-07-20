import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, LinkBlockProps } from '@/core'
import { Link as LinkIcon } from '@lucide/vue'
import LinkBlock from '@/blocks/link/LinkBlock.vue'
import LinkSettings from '@/blocks/link/LinkSettings.vue'
import { linkBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// A Link Block is a block-level clickable wrapper, but a bare <a> is inline.
const linkDefaultStyle: BaseBlockStyles = {
  display: 'block',
}

export const linkDef: VueBlockDefinition<LinkBlockProps> = {
  type: 'link',
  label: 'Link Block',
  description: 'Clickable wrapper',
  category: 'Basic',
  defaultProps: { href: '#' },
  defaultStyle: linkDefaultStyle,
  propsSchema: linkBlockPropsSchema,
  renderComponent: LinkBlock,
  settingsComponent: LinkSettings,
  icon: LinkIcon,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    const href = ctx.escape(block.props.href ?? '#')
    const target = block.props.target ? ` target="${ctx.escape(block.props.target)}"` : ''
    const rel = block.props.rel
      ? ` rel="${ctx.escape(block.props.rel)}"`
      : (block.props.target === '_blank' ? ' rel="noopener noreferrer"' : '')
    return `<a class="${ctx.classes}" href="${href}"${target}${rel}>${ctx.renderChildren()}</a>`
  },
}
