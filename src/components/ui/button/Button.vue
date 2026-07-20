<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { ClassValue } from 'clsx'
import type { Component } from 'vue'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    /** Leading icon component (e.g. a lucide icon), rendered before the slot. */
    icon?: Component
    class?: ClassValue
  }>(),
  {
    variant: 'default',
    size: 'default',
  },
)

const buttonVariants = cva(
  [
    'uf-ui-button',
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-medium',
    'cursor-pointer select-none transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
            'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
            'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        subtle:
            'border border-input bg-transparent text-uf-text hover:bg-uf-panel-muted data-[state=open]:bg-uf-panel-muted',
        secondary:
            'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

const classes = computed(() =>
  cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.class,
  ),
)
</script>

<template>
  <!-- type="button" is the safe default (fallthrough attrs still override it);
       submit buttons opt in with an explicit type="submit". -->
  <button type="button" :class="classes">
    <component :is="icon" v-if="icon" aria-hidden="true" />
    <slot />
  </button>
</template>
