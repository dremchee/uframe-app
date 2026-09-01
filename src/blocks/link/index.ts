import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, LinkBlockProps } from '@/core'
import { Link as LinkIcon } from '@lucide/vue'
import LinkBlock from '@/blocks/link/LinkBlock.vue'
import LinkSettings from '@/blocks/link/LinkSettings.vue'
import { tag } from '@/blocks/registry-helpers'
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
    const target = block.props.target
    return tag('a', {
      class: ctx.classes,
      href: block.props.href ?? '#',
      target: target || undefined,
      rel: block.props.rel || (target === '_blank' ? 'noopener noreferrer' : undefined),
    }, ctx.renderChildren())
  },
}
