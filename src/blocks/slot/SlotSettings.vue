<script setup lang="ts">
import type { SlotBlockProps } from '@/core'
import { Input, Label } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<SlotBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <Label>
    <span>{{ t('blocks.slot.name') }}</span>
    <Input v-model="model.name" type="text" />
  </Label>
</template>
