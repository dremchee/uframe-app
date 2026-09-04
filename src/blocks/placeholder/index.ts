import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { PlaceholderBlockProps } from '@/core'
import { SquareDashed } from '@lucide/vue'
import placeholderCss from '@/blocks/placeholder/placeholder.css?raw'
import PlaceholderBlock from '@/blocks/placeholder/PlaceholderBlock.vue'
import PlaceholderSettings from '@/blocks/placeholder/PlaceholderSettings.vue'
import { placeholderClasses, placeholderLabel, placeholderRatioValue } from '@/blocks/placeholder/render'
import { tag } from '@/blocks/registry-helpers'
import { placeholderBlockPropsSchema } from '@/core'

/**
 * Wireframe stand-in for content that does not exist yet. A block type of its
 * own (unlike the Element presets) because its parameters — what it stands for,
 * its caption, its proportions — are semantic rather than styles. Its look
 * ships as block CSS so an exported prototype still reads as a wireframe.
 */
export const placeholderDef: VueBlockDefinition<PlaceholderBlockProps> = {
  type: 'placeholder',
  label: 'Placeholder',
  description: 'Wireframe stand-in for content',
  category: 'Structure',
  defaultProps: { label: 'Image', kind: 'image', ratio: '16:9' },
  propsSchema: placeholderBlockPropsSchema,
  renderComponent: PlaceholderBlock,
  settingsComponent: PlaceholderSettings,
  icon: SquareDashed,
  css: placeholderCss,
  renderHtml(block, ctx) {
    const ratio = placeholderRatioValue(block.props)
    const label = placeholderLabel(block.props)
    return tag('div', {
      class: [ctx.classes, ...placeholderClasses(block.props)].filter(Boolean).join(' '),
      style: ratio ? `aspect-ratio: ${ratio}` : undefined,
    }, label ? tag('span', { class: 'uf-placeholder__label' }, ctx.escape(label)) : '')
  },
}
