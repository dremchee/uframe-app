<script setup lang="ts">
import { ChevronUp } from '@lucide/vue'
import { NumberFieldIncrement } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{ class?: string }>()
const { t } = useUframeI18n()
</script>

<template>
  <NumberFieldIncrement
    :class="cn(
      'inline-flex items-center justify-center w-full h-1/2',
      'text-uf-muted cursor-pointer transition-colors',
      'hover:bg-uf-panel-muted hover:text-uf-text',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
      $props.class,
    )"
    :aria-label="t('common.increment')"
  >
    <slot>
      <ChevronUp :size="12" :stroke-width="2" />
    </slot>
  </NumberFieldIncrement>
</template>
