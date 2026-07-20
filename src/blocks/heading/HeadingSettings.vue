<script setup lang="ts">
import type { HeadingBlockProps } from '@/core'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<HeadingBlockProps>({ required: true })
const { t } = useUframeI18n()

const levelOptions = [
  { label: 'H1', value: 1 },
  { label: 'H2', value: 2 },
  { label: 'H3', value: 3 },
  { label: 'H4', value: 4 },
  { label: 'H5', value: 5 },
  { label: 'H6', value: 6 },
]
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.heading.heading') }}</span>
      <Input v-model="model.content" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.heading.level') }}</span>
      <Select v-model="model.level">
        <SelectTrigger>
          <SelectValue :placeholder="t('blocks.heading.levelPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in levelOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </Label>
  </div>
</template>
