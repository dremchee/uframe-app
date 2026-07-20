<script setup lang="ts">
import type { FormBlockProps } from '@/core'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<FormBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.form.action') }}</span>
      <Input v-model="model.action" type="text" :placeholder="t('blocks.form.actionPlaceholder')" />
    </Label>
    <Label>
      <span>{{ t('blocks.form.method') }}</span>
      <Select
        :model-value="model.method ?? 'post'"
        @update:model-value="value => model.method = value as FormBlockProps['method']"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="post">POST</SelectItem>
          <SelectItem value="get">GET</SelectItem>
        </SelectContent>
      </Select>
    </Label>
    <Label>
      <span>{{ t('blocks.form.name') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.form.namePlaceholder')" />
    </Label>
  </div>
</template>
