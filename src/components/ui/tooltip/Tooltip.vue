<script setup lang="ts">
import type { ReferenceElement } from 'reka-ui'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import { usePortalTarget } from '@/components/ui/portal-target'

const props = withDefaults(defineProps<{
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  /** Controlled visibility for a tooltip anchored to an external element. */
  open?: boolean
  /** External anchor used by manual tooltips next to nested popup triggers. */
  reference?: ReferenceElement
  /** Render an inert internal trigger instead of wrapping the default slot. */
  manual?: boolean
}>(), {
  side: 'top',
  delay: 300,
  open: undefined,
  manual: false,
})

const portalTarget = usePortalTarget()
const rootProps = computed(() => (
  props.open === undefined ? {} : { open: props.open }
))
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <TooltipRoot v-bind="rootProps">
      <TooltipTrigger v-if="!manual" as-child :reference="reference">
        <slot />
      </TooltipTrigger>
      <TooltipTrigger v-else as-child :reference="reference">
        <span class="pointer-events-none fixed size-px opacity-0" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipPortal :to="portalTarget ?? undefined">
        <TooltipContent
          :side="side"
          :side-offset="6"
          class="uf-overlay uf-ui-tooltip-content z-50 w-fit max-w-72 overflow-hidden rounded-md border border-white/10 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md select-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1"
        >
          {{ text }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
