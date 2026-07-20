import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { BaseBlockStyles, ListBlockProps } from '@/core'
import { List as ListIcon } from '@lucide/vue'
import ListBlock from '@/blocks/list/ListBlock.vue'
import ListSettings from '@/blocks/list/ListSettings.vue'
import { listBlockPropsSchema } from '@/core'

// Default look lives in editable block styles, not hardcoded CSS — the user
// owns every aspect via the Style tab and it survives a clean export.
// Normalise the browser's 40px list indent to a compact 1.25em.
const listDefaultStyle: BaseBlockStyles = {
  paddingLeft: '1.25em',
}

export const listDef: VueBlockDefinition<ListBlockProps> = {
  type: 'list',
  label: 'List',
  description: 'Ordered or unordered list',
  category: 'Typography',
  defaultProps: { ordered: false },
  defaultStyle: listDefaultStyle,
  propsSchema: listBlockPropsSchema,
  renderComponent: ListBlock,
  settingsComponent: ListSettings,
  icon: ListIcon,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    const tag = block.props.ordered ? 'ol' : 'ul'
    return `<${tag} class="${ctx.classes}">${ctx.renderChildren()}</${tag}>`
  },
}
