<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldStepper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SizeInput,
} from '@/components/ui'
import { mergeStyles } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()

function update(patch: Partial<BaseBlockStyles>) {
  emit('update:modelValue', mergeStyles(styles.value, patch))
}

const selfOptions = ['auto', 'start', 'end', 'center', 'stretch']
</script>

<template>
  <div class="grid gap-2">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      <StyleField :label="t('style.grow')" field="flexGrow">
        <NumberField
          :model-value="styles.flexGrow ?? undefined"
          :min="0"
          @update:model-value="value => update({ flexGrow: Number.isFinite(value) ? value : undefined })"
        >
          <NumberFieldContent>
            <NumberFieldInput />
            <NumberFieldStepper>
              <NumberFieldIncrement />
              <NumberFieldDecrement />
            </NumberFieldStepper>
          </NumberFieldContent>
        </NumberField>
      </StyleField>
      <StyleField :label="t('style.shrink')" field="flexShrink">
        <NumberField
          :model-value="styles.flexShrink ?? undefined"
          :min="0"
          @update:model-value="value => update({ flexShrink: Number.isFinite(value) ? value : undefined })"
        >
          <NumberFieldContent>
            <NumberFieldInput />
            <NumberFieldStepper>
              <NumberFieldIncrement />
              <NumberFieldDecrement />
            </NumberFieldStepper>
          </NumberFieldContent>
        </NumberField>
      </StyleField>
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      <StyleField :label="t('style.basis')" field="flexBasis">
        <SizeInput
          :model-value="styles.flexBasis ?? ''"
          placeholder="auto"
          @update:model-value="(v: string | number) => update({ flexBasis: String(v) })"
        />
      </StyleField>
      <StyleField :label="t('style.alignSelf')" field="alignSelf">
        <Select
          :model-value="styles.alignSelf"
          @update:model-value="(v: unknown) => update({ alignSelf: v as BaseBlockStyles['alignSelf'] })"
        >
          <SelectTrigger><SelectValue placeholder="auto" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in selfOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
  </div>
</template>
