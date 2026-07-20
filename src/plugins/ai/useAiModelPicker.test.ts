import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useAiModelPicker } from './useAiModelPicker'

describe('useAiModelPicker', () => {
  it('filters models, exposes a custom id, and resets picker state after selection', () => {
    const model = ref('')
    const models = ref(['gpt-4.1-mini', 'gpt-4.1', 'o3-mini'])
    const picker = useAiModelPicker(model, models)

    picker.modelQuery.value = '4.1'
    expect(picker.filteredModels.value).toEqual(['gpt-4.1-mini', 'gpt-4.1'])
    expect(picker.customModelQuery.value).toBe('4.1')

    picker.modelOpen.value = true
    picker.selectModel('o3-mini')
    expect(model.value).toBe('o3-mini')
    expect(picker.modelOpen.value).toBe(false)
    expect(picker.modelQuery.value).toBe('')
  })

  it('clears a stale query when opened', () => {
    const picker = useAiModelPicker(ref(''), ref([]))
    picker.modelQuery.value = 'stale'
    picker.onModelOpenChange(true)
    expect(picker.modelQuery.value).toBe('')
  })
})
