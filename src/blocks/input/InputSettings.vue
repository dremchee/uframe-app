<script setup lang="ts">
import type { InputBlockProps, InputFieldType } from '@/core'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<InputBlockProps>({ required: true })
const { t } = useUframeI18n()

const typeOptions: InputFieldType[] = ['text', 'email', 'tel', 'password', 'number', 'url', 'search', 'date', 'time']
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.input.name') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.input.namePlaceholder')" />
    </Label>
    <Label>
      <span>{{ t('blocks.input.type') }}</span>
      <Select
        :model-value="model.type ?? 'text'"
        @update:model-value="value => model.type = value as InputFieldType"
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in typeOptions" :key="opt" :value="opt">{{ opt }}</SelectItem>
        </SelectContent>
      </Select>
    </Label>
    <Label>
      <span>{{ t('blocks.input.placeholder') }}</span>
      <Input v-model="model.placeholder" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.input.defaultValue') }}</span>
      <Input v-model="model.value" type="text" />
    </Label>
    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.required">
        {{ t('blocks.input.required') }}
      </Switch>
      <Switch v-model="model.disabled">
        {{ t('blocks.input.disabled') }}
      </Switch>
    </div>
  </div>
</template>
