<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      <StyleField :label="t('style.gridColumn')" field="gridColumn">
        <Input
          placeholder="auto"
          :model-value="styles.gridColumn ?? ''"
          @update:model-value="(v: string | number) => update({ gridColumn: String(v) })"
        />
      </StyleField>
      <StyleField :label="t('style.gridRow')" field="gridRow">
        <Input
          placeholder="auto"
          :model-value="styles.gridRow ?? ''"
          @update:model-value="(v: string | number) => update({ gridRow: String(v) })"
        />
      </StyleField>
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      <StyleField :label="t('style.justifySelf')" field="justifySelf">
        <Select
          :model-value="styles.justifySelf"
          @update:model-value="(v: unknown) => update({ justifySelf: v as BaseBlockStyles['justifySelf'] })"
        >
          <SelectTrigger><SelectValue placeholder="auto" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in selfOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
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
