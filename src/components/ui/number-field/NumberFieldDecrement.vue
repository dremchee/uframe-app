<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { NumberFieldDecrement } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{ class?: string }>()
const { t } = useUframeI18n()
</script>

<template>
  <NumberFieldDecrement
    :class="cn(
      'inline-flex items-center justify-center w-full h-1/2',
      'text-uf-muted cursor-pointer transition-colors',
      'hover:bg-uf-panel-muted hover:text-uf-text',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
      $props.class,
    )"
    :aria-label="t('common.decrement')"
  >
    <slot>
      <ChevronDown :size="12" :stroke-width="2" />
    </slot>
  </NumberFieldDecrement>
</template>
