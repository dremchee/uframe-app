import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { ImageBlockProps } from '@/core'
import { Image as ImageIcon } from '@lucide/vue'
import ImageBlock from '@/blocks/image/ImageBlock.vue'
import ImageSettings from '@/blocks/image/ImageSettings.vue'
import { imageBlockPropsSchema } from '@/core'

export const imageDef: VueBlockDefinition<ImageBlockProps> = {
  type: 'image',
  label: 'Image',
  description: 'Responsive image',
  category: 'Media',
  defaultProps: { src: '', alt: '', caption: '' },
  propsSchema: imageBlockPropsSchema,
  renderComponent: ImageBlock,
  settingsComponent: ImageSettings,
  bindableProps: ['src', 'alt'],
  icon: ImageIcon,
  renderHtml(block, ctx) {
    const parts: string[] = []
    if (block.props.src) {
      parts.push(`<img src="${ctx.escape(block.props.src)}" alt="${ctx.escape(block.props.alt ?? '')}">`)
    }
    if (block.props.caption) {
      parts.push(`<figcaption>${ctx.escape(block.props.caption)}</figcaption>`)
    }
    return `<figure class="${ctx.classes}">${parts.join('')}</figure>`
  },
}
