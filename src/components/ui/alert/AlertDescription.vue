<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()

const classes = computed(() =>
  cn('uf-ui-alert-description col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed', props.class),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
