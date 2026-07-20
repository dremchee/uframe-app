<script setup lang="ts">
import type { ButtonBlockProps, ButtonElement } from '@/core'
import { computed } from 'vue'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<ButtonBlockProps>({ required: true })
const { t } = useUframeI18n()

const kindOptions: Array<{ value: ButtonElement, label: string }> = [
  { value: 'link', label: t('blocks.button.link') },
  { value: 'button', label: t('blocks.button.button') },
  { value: 'submit', label: t('blocks.button.submit') },
  { value: 'reset', label: t('blocks.button.reset') },
]
const isLink = computed(() => (model.value.kind ?? 'link') === 'link')
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.button.label') }}</span>
      <Input v-model="model.label" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.button.kind') }}</span>
      <Select
        :model-value="model.kind ?? 'link'"
        @update:model-value="value => model.kind = value as ButtonElement"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in kindOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>
    </Label>
    <Label v-if="isLink">
      <span>{{ t('blocks.button.href') }}</span>
      <Input v-model="model.href" type="text" />
    </Label>
  </div>
</template>
