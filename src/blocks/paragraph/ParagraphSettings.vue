<script setup lang="ts">
import type { ParagraphBlockProps } from '@/core'
import { Label, Textarea } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<ParagraphBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.paragraph.text') }}</span>
      <Textarea v-model="model.content" rows="4" />
    </Label>
  </div>
</template>
