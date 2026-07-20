<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  variant?: AlertVariants['variant']
  class?: string
}>()

const alertVariants = cva(
  'uf-ui-alert relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[0_1fr] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/10 text-primary [&>svg]:text-current',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive [&>svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type AlertVariants = VariantProps<typeof alertVariants>

const classes = computed(() => cn(alertVariants({ variant: props.variant }), props.class))
</script>

<template>
  <div :class="classes" role="alert">
    <slot />
  </div>
</template>
