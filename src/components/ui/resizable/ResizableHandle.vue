<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from 'reka-ui'
import { GripVertical } from '@lucide/vue'
import {
  SplitterResizeHandle,

  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SplitterResizeHandleProps & { class?: string, withHandle?: boolean }>()
const emits = defineEmits<SplitterResizeHandleEmits>()

const delegated = computed(() => {
  const { class: _, withHandle: __, ...rest } = props
  return rest
})

const forwarded = useForwardPropsEmits(delegated, emits)

const classes = computed(() =>
  cn(
    'uf-ui-resizable-handle relative z-20 flex w-px items-center justify-center bg-uf-border transition-colors',
    'after:absolute after:z-20 after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full',
    'data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1',
    'data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2',
    'data-[orientation=vertical]:after:translate-x-0',
    // Thicken to 3px on hover/drag via the absolute `after` overlay so the
    // handle's own 1px footprint never changes — panels stay put. Hover uses
    // the native `:hover` (not reka's data-resize-handle-state) because reka
    // forces state="hover" on pointer-up and only clears it on the next
    // pointer move, which left the accent stuck after a resize.
    'after:transition-[background-color,width,height]',
    'hover:after:w-[3px] [&[data-resize-handle-state=drag]]:after:w-[3px]',
    'hover:after:bg-uf-accent [&[data-resize-handle-state=drag]]:after:bg-uf-accent',
    // A vertical splitter is a full-width horizontal bar — thicken its height,
    // and keep width full (the generic w-[3px] above would otherwise shrink it).
    'data-[orientation=vertical]:hover:after:h-[3px] data-[orientation=vertical]:[&[data-resize-handle-state=drag]]:after:h-[3px]',
    'data-[orientation=vertical]:hover:after:w-full data-[orientation=vertical]:[&[data-resize-handle-state=drag]]:after:w-full',
    'cursor-col-resize data-[orientation=vertical]:cursor-row-resize',
    props.class,
  ),
)
</script>

<template>
  <SplitterResizeHandle v-bind="forwarded" :class="classes">
    <template v-if="withHandle">
      <div
        class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border data-[orientation=vertical]:h-3 data-[orientation=vertical]:w-4"
      >
        <GripVertical :size="10" :stroke-width="1.75" class="text-muted-foreground" />
      </div>
    </template>
  </SplitterResizeHandle>
</template>
