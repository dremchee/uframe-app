<script setup lang="ts">
import type { SelectContentProps } from 'reka-ui'
import {
  SelectContent,

  SelectPortal,
  SelectViewport,
  useForwardProps,
} from 'reka-ui'
import { computed } from 'vue'
import { usePortalTarget } from '@/components/ui/portal-target'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<SelectContentProps & {
  class?: string
}>(), {
  position: 'popper',
})

const forwarded = useForwardProps(props)
const portalTarget = usePortalTarget()
const classes = computed(() => cn(
  'uf-overlay uf-ui-select-content',
  // max-h-64 instead of shadcn-default max-h-96: the editor's panels are
  // narrow and a 24rem dropdown (think: SizeInput's unit list) is taller
  // than the panel itself. Anything beyond ~8 items scrolls inside the menu.
  'relative z-50 max-h-64 min-w-32 overflow-hidden',
  'rounded-md border bg-popover text-popover-foreground shadow-md',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
  props.position === 'popper'
  && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1',
  props.class,
))
</script>

<template>
  <SelectPortal :to="portalTarget ?? undefined">
    <SelectContent v-bind="forwarded" :class="classes">
      <SelectViewport
        :class="cn(
          'uf-ui-select-viewport p-1',
          position === 'popper'
            && 'h-(--reka-select-trigger-height) w-full min-w-(--reka-select-trigger-width)',
        )"
      >
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
