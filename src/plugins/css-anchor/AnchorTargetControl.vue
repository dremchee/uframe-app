<script setup lang="ts">
import type { AnchorOption } from './useAnchorCandidates'
import type { BaseBlockStyles, PositionValue } from '@/core'
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import StyleField from '@/vue/components/style-panel/StyleField.vue'
import { useUframeI18n } from '@/vue/i18n'
import { normalizeAnchorName } from './anchor-css'

const props = defineProps<{
  modelValue: BaseBlockStyles
  candidates: AnchorOption[]
}>()

const emit = defineEmits<{
  update: [patch: Partial<BaseBlockStyles>]
}>()

const { t } = useUframeI18n()
const positionOptions: PositionValue[] = ['absolute', 'fixed']

function setTarget(value: unknown) {
  const next = String(value)
  if (next === 'none') {
    emit('update', {
      positionAnchor: undefined,
      positionArea: undefined,
      positionTryFallbacks: undefined,
      positionTryOrder: undefined,
      positionVisibility: undefined,
    })
    return
  }
  emit('update', {
    positionAnchor: next,
    position: props.modelValue.position === 'fixed' ? 'fixed' : 'absolute',
  })
}

function commitTarget(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  setTarget(value ? normalizeAnchorName(value) : 'none')
}
</script>

<template>
  <div class="grid gap-2.5">
    <div class="text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
      {{ t('cssAnchor.target') }}
    </div>
    <StyleField
      :label="t('cssAnchor.targetAnchor')"
      field="positionAnchor"
      :hint="t('cssAnchor.targetAnchorHint')"
    >
      <Select :model-value="modelValue.positionAnchor ?? 'none'" @update:model-value="setTarget">
        <SelectTrigger><SelectValue :placeholder="t('cssAnchor.noAnchor')" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            {{ t('cssAnchor.noAnchor') }}
          </SelectItem>
          <SelectItem v-for="candidate in candidates" :key="candidate.value" :value="candidate.value">
            {{ candidate.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </StyleField>
    <StyleField :label="t('cssAnchor.customAnchor')" field="positionAnchor">
      <Input :model-value="modelValue.positionAnchor" placeholder="--anchor-name" @change="commitTarget" />
    </StyleField>
    <StyleField v-if="modelValue.positionAnchor" :label="t('cssAnchor.positionType')" field="position">
      <Select
        :model-value="modelValue.position === 'fixed' ? 'fixed' : 'absolute'"
        @update:model-value="value => emit('update', { position: value as PositionValue })"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in positionOptions" :key="option" :value="option">
            {{ option }}
          </SelectItem>
        </SelectContent>
      </Select>
    </StyleField>
  </div>
</template>
