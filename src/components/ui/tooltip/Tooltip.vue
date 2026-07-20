<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { usePortalTarget } from '@/components/ui/portal-target'

withDefaults(defineProps<{
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}>(), {
  side: 'top',
  delay: 300,
})

const portalTarget = usePortalTarget()
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal :to="portalTarget ?? undefined">
        <TooltipContent
          :side="side"
          :side-offset="6"
          class="uf-overlay uf-ui-tooltip-content z-50 w-fit max-w-72 overflow-hidden rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-md select-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1"
        >
          {{ text }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
