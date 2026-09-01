import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { FormBlockProps } from '@/core'
import { FileText as FileTextIcon } from '@lucide/vue'
import FormBlock from '@/blocks/form/FormBlock.vue'
import FormSettings from '@/blocks/form/FormSettings.vue'
import { tag } from '@/blocks/registry-helpers'
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
    return tag('form', {
      class: ctx.classes,
      action: block.props.action || undefined,
      method: block.props.method ?? 'post',
      name: block.props.name || undefined,
    }, ctx.renderChildren())
  },
}
