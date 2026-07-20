<script setup lang="ts">
import { Button, Input, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

export interface OptionDraft {
  label: string
  value: string
  selected: boolean
}

const props = defineProps<{
  modelValue: OptionDraft
  submitLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: OptionDraft]
  'submit': []
  'cancel': []
}>()
const { t } = useUframeI18n()

function patch(part: Partial<OptionDraft>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'
</script>

<template>
  <form class="flex flex-col gap-2.5" @submit.prevent="emit('submit')">
    <label class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('blocks.select.label') }}</span>
      <Input
        :model-value="modelValue.label"
        class="h-8 text-xs"
        :placeholder="t('blocks.select.labelPlaceholder')"
        autofocus
        @update:model-value="v => patch({ label: String(v) })"
      />
    </label>
    <label class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('blocks.select.value') }}</span>
      <Input
        :model-value="modelValue.value"
        class="h-8 text-xs"
        :placeholder="t('blocks.select.valuePlaceholder')"
        @update:model-value="v => patch({ value: String(v) })"
      />
    </label>
    <Switch
      class="text-xs"
      :model-value="modelValue.selected"
      @update:model-value="v => patch({ selected: v })"
    >
      {{ t('blocks.select.defaultSelected') }}
    </Switch>
    <div class="flex justify-end gap-1.5 pt-0.5">
      <Button type="button" variant="ghost" size="sm" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" size="sm">
        {{ submitLabel ?? t('common.save') }}
      </Button>
    </div>
  </form>
</template>
