<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import { X } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,

  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { usePortalTarget } from '@/components/ui/portal-target'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<DialogContentProps & { class?: string }>()
const emit = defineEmits<DialogContentEmits>()
const portalTarget = usePortalTarget()
const { t } = useUframeI18n()

const delegated = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emit)
</script>

<template>
  <DialogPortal :to="portalTarget ?? undefined">
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'uf-overlay uf-dialog-content',
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4',
        'border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        props.class,
      )"
    >
      <slot />
      <DialogClose as-child>
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-3 top-3 size-7 text-muted-foreground"
          :aria-label="t('common.close')"
        >
          <X :size="16" :stroke-width="2" />
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
