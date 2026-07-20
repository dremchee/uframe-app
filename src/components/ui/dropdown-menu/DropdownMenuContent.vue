<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui'
import {
  DropdownMenuContent,

  DropdownMenuPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { usePortalTarget } from '@/components/ui/portal-target'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<DropdownMenuContentProps & { class?: string }>(), {
  align: 'end',
  sideOffset: 4,
})
const emit = defineEmits<DropdownMenuContentEmits>()
const portalTarget = usePortalTarget()

const delegated = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emit)
</script>

<template>
  <DropdownMenuPortal :to="portalTarget ?? undefined">
    <DropdownMenuContent
      v-bind="forwarded"
      :class="cn(
        'uf-overlay uf-ui-dropdown-content z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        props.class,
      )"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
