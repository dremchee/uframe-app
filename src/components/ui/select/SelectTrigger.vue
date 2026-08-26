<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import {
  injectSelectRootContext,
  SelectIcon,
  SelectTrigger,

  useForwardProps,
} from 'reka-ui'
import { computed, shallowRef } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<
  SelectTriggerProps & {
    class?: string
  }
>()

const forwarded = useForwardProps(props)
const select = injectSelectRootContext()
const wasOpenOnPointerDown = shallowRef(false)

// The dismissable layer sees a second click on the trigger before reka's
// trigger handler. Remember the pre-dismiss state in the window capture phase
// so the target handler can prevent reka from immediately reopening it.
useEventListener(window, 'pointerdown', (event) => {
  const trigger = select.triggerElement.value
  wasOpenOnPointerDown.value = select.open.value
    && !!trigger
    && event.target instanceof Node
    && trigger.contains(event.target)
}, { capture: true })

function closeOnRepeatedTriggerClick(event: PointerEvent) {
  if (!wasOpenOnPointerDown.value)
    return
  event.preventDefault()
  event.stopImmediatePropagation()
  select.onOpenChange(false)
}

const classes = computed(() =>
  cn(
    'uf-ui-select-trigger',
    'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap text-left',
    'rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
    'cursor-pointer [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-1 focus:ring-uf-accent focus:border-uf-accent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <SelectTrigger v-bind="forwarded" :class="classes" @pointerdown.capture="closeOnRepeatedTriggerClick">
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>
