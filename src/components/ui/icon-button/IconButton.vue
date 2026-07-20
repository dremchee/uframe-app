<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { ClassValue } from 'clsx'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Compact, square, ghost icon button used throughout the editor panels
 * (row actions, toggles, menu triggers). Themed on the `uf-*` tokens and
 * sized denser than the shadcn `Button` (whose only icon size is 36px).
 * Icons are passed via the default slot at their own size.
 */
const props = withDefaults(
  defineProps<{
    size?: IconButtonVariants['size']
    class?: ClassValue
  }>(),
  { size: 'md' },
)

const iconButtonVariants = cva(
  [
    'uf-ui-icon-button inline-grid place-items-center shrink-0 rounded-md',
    'text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent',
    'disabled:opacity-50 disabled:pointer-events-none',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      size: { sm: 'size-6', md: 'size-7', lg: 'size-8' },
    },
    defaultVariants: { size: 'md' },
  },
)

type IconButtonVariants = VariantProps<typeof iconButtonVariants>

const classes = computed(() => cn(iconButtonVariants({ size: props.size }), props.class))
</script>

<template>
  <button type="button" :class="classes">
    <slot />
  </button>
</template>
