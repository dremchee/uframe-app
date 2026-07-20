<script setup lang="ts">
import type { SelectOptionBlockProps } from '@/core'
import { Input, Label, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<SelectOptionBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.selectOption.label') }}</span>
      <Input v-model="model.label" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.selectOption.value') }}</span>
      <Input v-model="model.value" type="text" />
    </Label>
    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.selected">
        {{ t('blocks.selectOption.selected') }}
      </Switch>
      <Switch v-model="model.disabled">
        {{ t('blocks.selectOption.disabled') }}
      </Switch>
    </div>
  </div>
</template>
