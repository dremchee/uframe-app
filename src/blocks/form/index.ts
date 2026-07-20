import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { FormBlockProps } from '@/core'
import { FileText as FileTextIcon } from '@lucide/vue'
import FormBlock from '@/blocks/form/FormBlock.vue'
import FormSettings from '@/blocks/form/FormSettings.vue'
import { formBlockPropsSchema } from '@/core'

export const formDef: VueBlockDefinition<FormBlockProps> = {
  type: 'form',
  label: 'Form',
  description: 'Form container',
  category: 'Forms',
  defaultProps: { method: 'post' },
  propsSchema: formBlockPropsSchema,
  renderComponent: FormBlock,
  settingsComponent: FormSettings,
  icon: FileTextIcon,
  acceptsChildren: true,
  renderHtml(block, ctx) {
    const action = block.props.action ? ` action="${ctx.escape(block.props.action)}"` : ''
    const method = ` method="${block.props.method ?? 'post'}"`
    const name = block.props.name ? ` name="${ctx.escape(block.props.name)}"` : ''
    return `<form class="${ctx.classes}"${action}${method}${name}>${ctx.renderChildren()}</form>`
  },
}
