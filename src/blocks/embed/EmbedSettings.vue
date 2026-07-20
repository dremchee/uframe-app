<script setup lang="ts">
import type { EmbedBlockProps } from '@/core'
import { CodeEditor, Label } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<EmbedBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.embed.html') }}</span>
      <CodeEditor
        v-model="model.html"
        language="html"
        :rows="10"
        :placeholder="t('blocks.embed.htmlPlaceholder')"
      />
    </Label>
    <p class="m-0 text-uf-muted text-[11px] leading-snug">
      {{ t('blocks.embed.trustHint') }}
    </p>
  </div>
</template>
