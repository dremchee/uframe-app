import type { ComputedRef } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, ref } from 'vue'
import { useSymbolInstanceActions } from '@/vue/composables/symbols/useSymbolInstanceActions'
import { useConfirmDialog } from '@/vue/composables/ui/useConfirmDialog'
import { useUframeI18n } from '@/vue/i18n'

export interface UseSymbolInstancePanelOptions {
  editor: PageEditorInstance
  block: ComputedRef<PageBlock | undefined>
  availableClasses: ComputedRef<string[]>
  sanitizeClassName: (raw: string) => string
}

/**
 * Owns the component-instance branch of PropertiesPanel: variant and rename
 * popovers, symbol property mutations, slot actions, and detach confirmation.
 * The panel remains responsible only for composing the corresponding template.
 */
export function useSymbolInstancePanel(opts: UseSymbolInstancePanelOptions) {
  const { editor, block, availableClasses, sanitizeClassName } = opts
  const { t } = useUframeI18n()
  const confirm = useConfirmDialog()
  const {
    isSymbolInstance,
    instanceSymbol,
    activeVariant,
    selectedVariantId,
    variantClassInput,
    renameComponent,
    detachInstance,
    editMaster,
    createVariant,
    renameActiveVariant,
    deleteActiveVariant,
    applyVariantClass,
    removeVariantClass,
  } = useSymbolInstanceActions({ editor, block, confirm, sanitizeClassName })

  const variantForm = ref<{ open: boolean, mode: 'add' | 'rename' | 'delete', name: string }>({
    open: false,
    mode: 'add',
    name: '',
  })

  function openAddVariant() {
    variantForm.value = { open: true, mode: 'add', name: t('properties.newVariant') }
  }

  function openRenameVariant() {
    if (!activeVariant.value)
      return
    const name = activeVariant.value.name
    requestAnimationFrame(() => {
      variantForm.value = { open: true, mode: 'rename', name }
    })
  }

  function openDeleteVariant() {
    if (!activeVariant.value)
      return
    const name = activeVariant.value.name
    requestAnimationFrame(() => {
      variantForm.value = { open: true, mode: 'delete', name }
    })
  }

  function submitVariantForm() {
    if (variantForm.value.mode === 'delete') {
      deleteActiveVariant()
      variantForm.value.open = false
      return
    }
    const name = variantForm.value.name.trim()
    if (!name)
      return
    if (variantForm.value.mode === 'add')
      createVariant(name)
    else
      renameActiveVariant(name)
    variantForm.value.open = false
  }

  const variantClassSuggestions = computed(() => {
    const applied = new Set(activeVariant.value?.classes ?? [])
    return availableClasses.value.filter(name => !applied.has(name))
  })

  function setInstanceProperty(propertyId: string, value: unknown) {
    if (block.value)
      editor.setInstanceProperty(block.value.id, propertyId, value)
  }

  function resetInstanceProperty(propertyId: string) {
    if (block.value)
      editor.resetInstanceProperty(block.value.id, propertyId)
  }

  function editInstanceSlotElement(slotId: string) {
    if (block.value)
      editor.editInstanceSlotElement(block.value.id, slotId)
  }

  function resetInstanceSlot(slotId: string) {
    if (block.value)
      editor.resetInstanceSlot(block.value.id, slotId)
  }

  return {
    confirm,
    isSymbolInstance,
    instanceSymbol,
    activeVariant,
    selectedVariantId,
    variantClassInput,
    variantForm,
    variantClassSuggestions,
    renameComponent,
    detachInstance,
    editMaster,
    openAddVariant,
    openRenameVariant,
    openDeleteVariant,
    submitVariantForm,
    setInstanceProperty,
    resetInstanceProperty,
    editInstanceSlotElement,
    resetInstanceSlot,
    applyVariantClass,
    removeVariantClass,
  }
}
