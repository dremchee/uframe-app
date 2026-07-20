<script setup lang="ts">
import { WandSparkles } from '@lucide/vue'
import { Button, Tooltip } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'
import { toggleAiChat } from './useAiChat'

const { t } = useUframeI18n()
</script>

<template>
  <Tooltip :text="t('ai.assistant')">
    <Button variant="outline" size="icon" type="button" :aria-label="t('ai.assistant')" @click="toggleAiChat">
      <WandSparkles />
    </Button>
  </Tooltip>
</template>
