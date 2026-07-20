import type { Ref } from 'vue'
import { computed, ref } from 'vue'

/** Shared searchable model picker state for the AI chat and Settings surfaces. */
export function useAiModelPicker(model: Ref<string>, models: Readonly<Ref<string[]>>) {
  const modelOpen = ref(false)
  const modelQuery = ref('')
  const filteredModels = computed(() => {
    const query = modelQuery.value.trim().toLowerCase()
    return query ? models.value.filter(item => item.toLowerCase().includes(query)) : models.value
  })
  const customModelQuery = computed(() => {
    const query = modelQuery.value.trim()
    return query && !models.value.includes(query) ? query : ''
  })

  function onModelOpenChange(open: boolean) {
    if (open)
      modelQuery.value = ''
  }

  function selectModel(id: string) {
    model.value = id
    modelOpen.value = false
    modelQuery.value = ''
  }

  return {
    modelOpen,
    modelQuery,
    filteredModels,
    customModelQuery,
    onModelOpenChange,
    selectModel,
  }
}
