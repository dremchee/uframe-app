import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import type { SelectOptionBlockProps } from '@/core'
import { Plus as PlusIcon } from '@lucide/vue'
import { tag } from '@/blocks/registry-helpers'
import SelectOptionBlock from '@/blocks/select-option/SelectOptionBlock.vue'
import SelectOptionSettings from '@/blocks/select-option/SelectOptionSettings.vue'
import { selectOptionBlockPropsSchema } from '@/core'

export const selectOptionDef: VueBlockDefinition<SelectOptionBlockProps> = {
  type: 'select-option',
  label: 'Select Option',
  description: 'Dropdown entry',
  category: 'Forms',
  defaultProps: { value: '', label: 'Option' },
  propsSchema: selectOptionBlockPropsSchema,
  renderComponent: SelectOptionBlock,
  settingsComponent: SelectOptionSettings,
  icon: PlusIcon,
  renderHtml(block, ctx) {
    const p = block.props
    return tag('option', {
      class: ctx.classes,
      value: p.value ?? '',
      selected: p.selected,
      disabled: p.disabled,
    }, ctx.escape(p.label || p.value || ''))
  },
}
