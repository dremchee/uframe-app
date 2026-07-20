import type { ComputedRef } from 'vue'
import type { PageBlock } from '@/core'
import type { useConfirmDialog } from '@/vue/composables/ui/useConfirmDialog'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, ref, watch } from 'vue'
import {
  getInstanceSymbolId,
  getInstanceVariantId,

  resolveActiveVariant,
  SYMBOL_INSTANCE_BLOCK_TYPE,
} from '@/core'
import { useUframeI18n } from '@/vue/i18n'

export interface UseSymbolInstanceActionsOptions {
  editor: PageEditorInstance
  block: ComputedRef<PageBlock | undefined>
  confirm: ReturnType<typeof useConfirmDialog>
  /**
   * Shared sanitiser from useBlockClasses so variant-class names match the
   *  same alphabet as block-class names.
   */
  sanitizeClassName: (raw: string) => string
}

/**
 * Owns everything the properties panel needs when a symbol instance (or a
 * "save as component" candidate) is selected: master/variant lookups, the
 * variant Select model, and all the popover/confirm-driven actions
 * (save-as-component, rename, detach, edit master, variant CRUD, variant
 * class list).
 */
export function useSymbolInstanceActions(opts: UseSymbolInstanceActionsOptions) {
  const { editor, block, confirm, sanitizeClassName } = opts
  const { t } = useUframeI18n()

  const isSymbolInstance = computed(() => block.value?.type === SYMBOL_INSTANCE_BLOCK_TYPE)
  const instanceSymbol = computed(() => {
    if (!isSymbolInstance.value || !block.value)
      return undefined
    const id = getInstanceSymbolId(block.value)
    if (!id)
      return undefined
    return editor.effectiveDocument.value.symbols?.[id]
  })

  // Active variant resolution mirrors the renderer so the panel shows the
  // same variant that's currently being rendered on canvas.
  const activeVariant = computed(() => {
    if (!instanceSymbol.value || !block.value)
      return null
    return resolveActiveVariant(instanceSymbol.value, getInstanceVariantId(block.value))
  })

  const selectedVariantId = computed<string>({
    get: () => activeVariant.value?.id ?? '',
    set: (id) => {
      if (!block.value)
        return
      editor.setInstanceVariant(block.value.id, id || null)
    },
  })

  const variantClassInput = ref('')
  // Live-filter input the same way block-class input is filtered.
  watch(variantClassInput, (value) => {
    const cleaned = value.replace(/[^\w\-\s]/g, '')
    if (cleaned !== value)
      variantClassInput.value = cleaned
  })

  // Turn the selected block into a reusable component. Driven by an inline
  // popover in the panel (not a modal), so it takes the name directly.
  function saveAsComponent(name: string) {
    if (!block.value)
      return
    editor.saveBlockAsSymbol(block.value.id, name)
  }

  // Rename the component everywhere it's used. Driven by an inline popover.
  function renameComponent(name: string) {
    if (!instanceSymbol.value)
      return
    editor.renameSymbol(instanceSymbol.value.id, name)
  }

  function detachInstance() {
    if (!block.value)
      return
    const id = block.value.id
    confirm.openConfirm({
      title: t('properties.detachInstanceTitle'),
      description: t('properties.detachInstanceDescription'),
      confirmText: t('properties.detach'),
      onConfirm: () => editor.detachSymbolInstance(id),
    })
  }

  function editMaster() {
    if (!instanceSymbol.value)
      return
    editor.enterSymbolEdit(instanceSymbol.value.id, block.value?.id)
  }

  // Create a variant and switch the instance to it. Driven by an inline popover
  // in the panel (not a modal), so it takes the name directly.
  function createVariant(name: string) {
    if (!instanceSymbol.value)
      return
    const variantId = editor.createSymbolVariant(instanceSymbol.value.id, name)
    if (variantId && block.value)
      editor.setInstanceVariant(block.value.id, variantId)
  }

  // Rename the active variant. Also driven by the inline popover.
  function renameActiveVariant(name: string) {
    if (!instanceSymbol.value || !activeVariant.value)
      return
    editor.renameSymbolVariant(instanceSymbol.value.id, activeVariant.value.id, name)
  }

  // Delete the active variant. The inline popover is the confirmation step, so
  // this deletes directly. Guarded so the last variant can't be removed.
  function deleteActiveVariant() {
    if (!instanceSymbol.value || !activeVariant.value)
      return
    if (instanceSymbol.value.variants.length <= 1)
      return
    editor.deleteSymbolVariant(instanceSymbol.value.id, activeVariant.value.id)
  }

  // `name` comes from the autocomplete's apply event (typed text or a picked
  // suggestion); the input model only serves as the field's visible state.
  function applyVariantClass(name: string) {
    if (!instanceSymbol.value || !activeVariant.value)
      return
    const raw = name.trim()
    if (!raw)
      return
    const cleaned = sanitizeClassName(raw)
    if (!cleaned)
      return
    if (activeVariant.value.classes.includes(cleaned)) {
      variantClassInput.value = ''
      return
    }
    // Guarantee the class is in document.styles so the variant has
    // somewhere to attach its styling.
    editor.ensureClass(cleaned)
    const next = [...activeVariant.value.classes, cleaned]
    editor.setSymbolVariantClasses(instanceSymbol.value.id, activeVariant.value.id, next)
    variantClassInput.value = ''
  }

  function removeVariantClass(name: string) {
    if (!instanceSymbol.value || !activeVariant.value)
      return
    const next = activeVariant.value.classes.filter(c => c !== name)
    editor.setSymbolVariantClasses(instanceSymbol.value.id, activeVariant.value.id, next)
  }

  return {
    isSymbolInstance,
    instanceSymbol,
    activeVariant,
    selectedVariantId,
    variantClassInput,
    saveAsComponent,
    renameComponent,
    detachInstance,
    editMaster,
    createVariant,
    renameActiveVariant,
    deleteActiveVariant,
    applyVariantClass,
    removeVariantClass,
  }
}
