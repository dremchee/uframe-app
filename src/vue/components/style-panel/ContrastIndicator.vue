<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import type { ContrastEvaluation } from '@/vue/composables/style/useStyleContrast'
import { CircleAlert, CircleCheck, CircleHelp } from '@lucide/vue'
import { computed, inject, onBeforeUnmount, shallowRef } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { STYLE_CONTRAST_KEY } from '@/vue/composables/style/useStyleContrast'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  styles: BaseBlockStyles
}>()

const { t } = useUframeI18n()
const contrast = inject(STYLE_CONTRAST_KEY)
const popoverOpen = shallowRef(false)
let closeTimer: ReturnType<typeof setTimeout> | undefined
const evaluation = computed<ContrastEvaluation>(() =>
  contrast?.evaluate(props.styles) ?? { status: 'unavailable', reason: 'background' },
)
const isPassing = computed(() => evaluation.value.status === 'ready' && evaluation.value.level !== 'fail')
const icon = computed(() => {
  if (evaluation.value.status !== 'ready')
    return CircleHelp
  return isPassing.value ? CircleCheck : CircleAlert
})
const iconClass = computed(() => {
  if (evaluation.value.status !== 'ready')
    return 'text-uf-muted hover:text-uf-text'
  return isPassing.value
    ? 'text-uf-accent-strong hover:text-uf-accent'
    : 'text-destructive hover:text-destructive/80'
})
const statusTitle = computed(() => {
  if (evaluation.value.status === 'unavailable')
    return t('style.contrastUnavailableTitle')
  const { level } = evaluation.value
  return level === 'aaa'
    ? t('style.contrastExcellent')
    : level === 'aa'
      ? t('style.contrastGood')
      : t('style.contrastLow')
})
const statusDescription = computed(() => {
  if (evaluation.value.status !== 'ready')
    return evaluation.value.reason === 'background' ? t('style.contrastBackgroundUnknown') : t('style.contrastColorUnknown')
  if (evaluation.value.level === 'aaa')
    return t('style.contrastExcellentDescription')
  if (evaluation.value.level === 'aa')
    return t('style.contrastGoodDescription')
  return t('style.contrastLowDescription')
})
const technicalLabel = computed(() => evaluation.value.status === 'ready'
  ? t('style.contrastTechnical', { ratio: evaluation.value.ratio.toFixed(2) })
  : '',
)

function showPopover() {
  if (closeTimer)
    clearTimeout(closeTimer)
  popoverOpen.value = true
}

function schedulePopoverClose() {
  if (closeTimer)
    clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    popoverOpen.value = false
  }, 120)
}

function onPopoverOpenChange(open: boolean) {
  if (open)
    showPopover()
  else
    schedulePopoverClose()
}

onBeforeUnmount(() => {
  if (closeTimer)
    clearTimeout(closeTimer)
})
</script>

<template>
  <Popover :open="popoverOpen" @update:open="onPopoverOpenChange">
    <span
      class="inline-flex"
      @pointerenter="showPopover"
      @pointerleave="schedulePopoverClose"
      @focusin="showPopover"
      @focusout="schedulePopoverClose"
    >
      <PopoverTrigger as-child>
        <button
          type="button"
          class="ml-1 inline-flex size-4 shrink-0 items-center justify-center rounded outline-none transition-colors focus-visible:ring-1 focus-visible:ring-uf-accent"
          :class="iconClass"
          :aria-label="t('style.contrast')"
        >
          <component :is="icon" :size="14" :stroke-width="2" />
        </button>
      </PopoverTrigger>
    </span>
    <PopoverContent
      class="grid w-72 gap-3 p-3"
      hide-close
      side="left"
      align="start"
      @open-auto-focus.prevent
      @close-auto-focus.prevent
      @pointerenter="showPopover"
      @pointerleave="schedulePopoverClose"
    >
      <h3 class="text-sm font-semibold text-uf-text">
        {{ t('style.contrast') }}
      </h3>
      <div v-if="evaluation.status === 'ready'" class="flex items-center gap-2">
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded border border-black/10 text-sm font-semibold"
          :style="{ color: evaluation.foreground, backgroundColor: evaluation.background }"
          role="img"
          :aria-label="t('style.contrastTextColor')"
        >Aa</span>
        <span
          class="h-7 w-7 rounded border border-black/10"
          :style="{ backgroundColor: evaluation.background }"
          role="img"
          :aria-label="t('style.contrastBackgroundColor')"
        />
      </div>

      <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <component :is="icon" class="mt-0.5" :class="iconClass" :size="16" :stroke-width="2" />
        <p class="text-sm font-medium text-uf-text">
          {{ statusTitle }}
        </p>
        <p class="col-start-2 text-xs leading-4 text-uf-muted">
          {{ statusDescription }}
        </p>
      </div>

      <p v-if="evaluation.status === 'ready'" class="border-t border-uf-border pt-2 text-[11px] leading-4 text-uf-muted">
        {{ technicalLabel }}
      </p>
    </PopoverContent>
  </Popover>
</template>
