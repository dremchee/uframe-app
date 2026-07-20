import type { PageBlock, SymbolDefinition, SymbolPropertyDefinition } from '@/core'
import { computed, shallowRef, watch } from 'vue'
import { useUframeI18n } from '@/vue/i18n'
import { humanizePropertyKey } from '@/vue/utils/symbol-editor'
import { localizedLabel } from '@/vue/utils/translation-fallback'

export interface UseSymbolMasterPropertiesOptions {
  block: () => PageBlock
  symbol: () => SymbolDefinition
  expose: (prop: string, label?: string) => void
  rename: (propertyId: string, label: string) => void
}

/**
 * State and derived values for authoring a component's exposed properties.
 * The component remains responsible for rendering popovers and emitting
 * removal requests; this controller only drives their forms.
 */
export function useSymbolMasterProperties(options: UseSymbolMasterPropertiesOptions) {
  const { block, symbol, expose, rename } = options
  const { t } = useUframeI18n()
  const renameId = shallowRef<string | null>(null)
  const renameValue = shallowRef('')
  const addForm = shallowRef<{ open: boolean, prop?: string, name: string }>({
    open: false,
    prop: undefined,
    name: '',
  })

  function propertyLabel(property: SymbolPropertyDefinition): string {
    return localizedLabel(property, t) ?? property.label
  }

  const exposedProperties = computed<SymbolPropertyDefinition[]>(() =>
    (symbol().properties ?? []).filter(property => property.target.blockId === block().id),
  )
  const exposedPropNames = computed(() =>
    new Set(exposedProperties.value.map(property => property.target.prop)),
  )
  const candidates = computed(() => Object.entries(block().props)
    .filter(([prop, value]) =>
      !exposedPropNames.value.has(prop)
      && (value === null || ['string', 'number', 'boolean'].includes(typeof value)),
    )
    .map(([prop]) => ({ prop, label: humanizePropertyKey(prop) })),
  )
  const namePlaceholder = computed(() => {
    const candidate = candidates.value.find(candidate => candidate.prop === addForm.value.prop)
    return candidate?.label ?? t('properties.propertyName')
  })

  watch(
    () => block().id,
    () => {
      addForm.value.open = false
      renameId.value = null
    },
  )

  function openRename(property: SymbolPropertyDefinition) {
    renameId.value = property.id
    renameValue.value = property.label
  }

  function submitRename() {
    const id = renameId.value
    const label = renameValue.value.trim()
    if (id && label)
      rename(id, label)
    renameId.value = null
  }

  function onAddOpenChange(open: boolean) {
    if (open)
      addForm.value = { open: true, prop: undefined, name: '' }
    else
      addForm.value.open = false
  }

  function submitAdd() {
    const { prop, name } = addForm.value
    if (!prop)
      return
    expose(prop, name.trim() || undefined)
    addForm.value.open = false
  }

  return {
    addForm,
    candidates,
    exposedProperties,
    namePlaceholder,
    onAddOpenChange,
    openRename,
    propertyLabel,
    renameId,
    renameValue,
    submitAdd,
    submitRename,
  }
}
