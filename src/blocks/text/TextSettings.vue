<script setup lang="ts">
import type { TextBlockProps } from '@/core'
import { Label, Textarea } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<TextBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.text.text') }}</span>
      <Textarea v-model="model.content" class="min-h-32" />
    </Label>
  </div>
</template>
