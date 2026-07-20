<script setup lang="ts">
import type { LabelBlockProps } from '@/core'
import { Input, Label } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<LabelBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.label.text') }}</span>
      <Input v-model="model.text" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.label.forInput') }}</span>
      <Input v-model="model.for" type="text" :placeholder="t('blocks.label.forPlaceholder')" />
    </Label>
  </div>
</template>
