<script setup lang="ts">
import type { TextAreaBlockProps } from '@/core'
import { Input, Label, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<TextAreaBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.textarea.name') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.textarea.namePlaceholder')" />
    </Label>
    <Label>
      <span>{{ t('blocks.textarea.placeholder') }}</span>
      <Input v-model="model.placeholder" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.textarea.rows') }}</span>
      <Input v-model.number="model.rows" type="number" />
    </Label>
    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.required">
        {{ t('blocks.textarea.required') }}
      </Switch>
      <Switch v-model="model.disabled">
        {{ t('blocks.textarea.disabled') }}
      </Switch>
    </div>
  </div>
</template>
