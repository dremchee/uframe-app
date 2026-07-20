<script setup lang="ts">
import type { CheckboxBlockProps } from '@/core'
import { Input, Label, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<CheckboxBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.checkbox.label') }}</span>
      <Input v-model="model.label" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.checkbox.name') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.checkbox.namePlaceholder')" />
    </Label>
    <Label>
      <span>{{ t('blocks.checkbox.value') }}</span>
      <Input v-model="model.value" type="text" :placeholder="t('blocks.checkbox.valuePlaceholder')" />
    </Label>
    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.checked">
        {{ t('blocks.checkbox.checked') }}
      </Switch>
      <Switch v-model="model.required">
        {{ t('blocks.checkbox.required') }}
      </Switch>
    </div>
  </div>
</template>
