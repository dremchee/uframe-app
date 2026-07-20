<script setup lang="ts">
import type { ListBlockProps } from '@/core'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<ListBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.list.style') }}</span>
      <Select
        :model-value="model.ordered ? 'ordered' : 'unordered'"
        @update:model-value="value => model.ordered = value === 'ordered'"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="unordered">{{ t('blocks.list.unordered') }}</SelectItem>
          <SelectItem value="ordered">{{ t('blocks.list.ordered') }}</SelectItem>
        </SelectContent>
      </Select>
    </Label>
  </div>
</template>
