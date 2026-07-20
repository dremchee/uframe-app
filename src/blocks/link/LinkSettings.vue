<script setup lang="ts">
import type { LinkBlockProps } from '@/core'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<LinkBlockProps>({ required: true })
const { t } = useUframeI18n()

const targetOptions: Array<{ value: NonNullable<LinkBlockProps['target']>, label: string }> = [
  { value: '_self', label: t('blocks.link.sameTab') },
  { value: '_blank', label: t('blocks.link.newTab') },
  { value: '_parent', label: t('blocks.link.parentFrame') },
  { value: '_top', label: t('blocks.link.topFrame') },
]
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.link.href') }}</span>
      <Input v-model="model.href" type="text" placeholder="https://..." />
    </Label>
    <Label>
      <span>{{ t('blocks.link.target') }}</span>
      <Select
        :model-value="model.target ?? '_self'"
        @update:model-value="value => model.target = value as LinkBlockProps['target']"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in targetOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
        </SelectContent>
      </Select>
    </Label>
    <Label>
      <span>{{ t('blocks.link.rel') }}</span>
      <Input v-model="model.rel" type="text" placeholder="noopener noreferrer" />
    </Label>
  </div>
</template>
