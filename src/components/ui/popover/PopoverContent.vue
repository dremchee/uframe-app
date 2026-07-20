<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import { X } from '@lucide/vue'
import {
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { usePortalTarget } from '@/components/ui/portal-target'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<PopoverContentProps & {
  class?: string
  /**
   * Header title. When set, the popover renders a full-bleed header row —
   * title on the left, the close button beside it — separated from the body
   * by a border. Content padding then moves onto the body wrapper (see
   * `bodyClass`). Without a title the close button floats in the corner.
   */
  title?: string
  /**
   * Classes for the body wrapper rendered under a titled header (defaults to
   * `p-2`). Use for full-bleed bodies (`p-0`) or layout the content rows
   * expect (`flex flex-col gap-2.5`).
   */
  bodyClass?: string
  /**
   * Every popover carries a close button by default — outside-click dismissal
   * can't see clicks landing inside the canvas iframe, so an explicit close
   * affordance must always exist. Opt out for dense contents.
   */
  hideClose?: boolean
}>(), {
  align: 'center',
  sideOffset: 6,
})
const emits = defineEmits<PopoverContentEmits>()
const portalTarget = usePortalTarget()
const { t } = useUframeI18n()

const delegated = computed(() => {
  const { class: _class, bodyClass: _bodyClass, hideClose: _hideClose, title: _title, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const classes = computed(() =>
  cn(
    'uf-overlay uf-ui-popover-content z-50 rounded-md border border-uf-border bg-uf-panel text-uf-text shadow-md outline-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
    // Titled popovers pad the BODY instead of the root, so the header rule
    // can run edge to edge without negative-margin tricks.
    props.title ? 'p-0' : 'p-2',
    props.class,
  ),
)
</script>

<template>
  <PopoverPortal :to="portalTarget ?? undefined">
    <PopoverContent v-bind="forwarded" :class="classes">
      <template v-if="title">
        <div class="flex items-center justify-between gap-2 border-b border-uf-border px-2.5 py-2">
          <span class="min-w-0 truncate text-sm font-semibold text-uf-text">{{ title }}</span>
          <PopoverClose
            v-if="!hideClose"
            class="inline-flex size-5 shrink-0 items-center justify-center rounded text-uf-muted cursor-pointer transition-colors outline-none hover:bg-uf-panel-muted hover:text-uf-text focus-visible:ring-1 focus-visible:ring-uf-accent"
            :aria-label="t('common.close')"
          >
            <X :size="13" :stroke-width="2" />
          </PopoverClose>
        </div>
        <div :class="cn('p-2', bodyClass)">
          <slot />
        </div>
      </template>
      <template v-else>
        <PopoverClose
          v-if="!hideClose"
          class="absolute right-1.5 top-1.5 z-10 inline-flex size-5 items-center justify-center rounded text-uf-muted cursor-pointer transition-colors outline-none hover:bg-uf-panel-muted hover:text-uf-text focus-visible:ring-1 focus-visible:ring-uf-accent"
          :aria-label="t('common.close')"
        >
          <X :size="13" :stroke-width="2" />
        </PopoverClose>
        <slot />
      </template>
    </PopoverContent>
  </PopoverPortal>
</template>
