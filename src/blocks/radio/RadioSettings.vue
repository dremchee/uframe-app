<script setup lang="ts">
import type { RadioBlockProps } from '@/core'
import { Input, Label, Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<RadioBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.radio.label') }}</span>
      <Input v-model="model.label" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.radio.groupName') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.radio.groupPlaceholder')" />
    </Label>
    <Label>
      <span>{{ t('blocks.radio.value') }}</span>
      <Input v-model="model.value" type="text" :placeholder="t('blocks.radio.valuePlaceholder')" />
    </Label>
    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.checked">
        {{ t('blocks.radio.checked') }}
      </Switch>
      <Switch v-model="model.required">
        {{ t('blocks.radio.required') }}
      </Switch>
    </div>
  </div>
</template>
