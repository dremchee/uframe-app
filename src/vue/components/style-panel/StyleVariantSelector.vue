<script setup lang="ts">
import type { BreakpointDef, StyleState, StyleViewport } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import { computed, nextTick, ref } from 'vue'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { autoIconKey } from '@/vue/components/breakpoint-icons'
import BreakpointForm from '@/vue/components/BreakpointForm.vue'
import BreakpointSegmentControl from '@/vue/components/BreakpointSegmentControl.vue'
import { useUframeI18n } from '@/vue/i18n'

export type ViewportKey = StyleViewport
export type StateKey = 'default' | StyleState

const props = defineProps<{
  viewport: ViewportKey
  state: StateKey
  breakpoints: BreakpointDef[]
}>()

const emit = defineEmits<{
  'update:viewport': [value: ViewportKey]
  'update:state': [value: StateKey]
  'add-breakpoint': [draft: BreakpointDraft]
}>()
const { t } = useUframeI18n()

const stateOptions = computed<Array<{ value: StateKey, label: string }>>(() => [
  { value: 'default', label: t('style.stateDefault') },
  { value: 'hover', label: t('style.stateHover') },
  { value: 'focus', label: t('style.stateFocus') },
  { value: 'active', label: t('style.stateActive') },
])

const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'

function emptyBreakpointDraft(): BreakpointDraft {
  const base = { label: '', direction: 'max' as const, width: 600 }
  return { ...base, icon: autoIconKey(base) }
}

const addBreakpointOpen = ref(false)
const addBreakpointDraft = ref<BreakpointDraft>(emptyBreakpointDraft())
const addBreakpointError = ref('')

function onAddBreakpointOpenChange(open: boolean) {
  addBreakpointOpen.value = open
  if (open) {
    addBreakpointDraft.value = emptyBreakpointDraft()
    addBreakpointError.value = ''
  }
}

function openAddBreakpoint() {
  // The menu restores focus while it closes. Open the popover after that
  // lifecycle completes, otherwise its focus-outside guard closes it at once.
  void nextTick(() => requestAnimationFrame(() => onAddBreakpointOpenChange(true)))
}

function keepAddBreakpointPopoverOpen(event: Event) {
  // The dropdown returns focus to its trigger after selecting its footer item.
  // That focus transition is not an intent to dismiss the newly opened form.
  event.preventDefault()
}

function submitAddBreakpoint() {
  const draft = addBreakpointDraft.value
  const isDuplicate = props.breakpoints.some(breakpoint =>
    breakpoint.direction === draft.direction
    && breakpoint.width === draft.width
    && (breakpoint.direction !== 'between' || breakpoint.widthMax === draft.widthMax),
  )
  if (isDuplicate) {
    addBreakpointError.value = t('breakpoints.duplicateRange')
    return
  }
  emit('add-breakpoint', draft)
  onAddBreakpointOpenChange(false)
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2 mb-2">
    <!-- Breakpoint: device segment control with the overflow menu as its last segment. -->
    <Popover :open="addBreakpointOpen" @update:open="onAddBreakpointOpenChange">
      <PopoverAnchor as-child>
        <div class="flex flex-col gap-1 min-w-0">
          <span :class="fieldLabel">{{ t('style.breakpoint') }}</span>
          <BreakpointSegmentControl
            :model-value="viewport"
            :breakpoints="breakpoints"
            @update:model-value="value => emit('update:viewport', value)"
            @add="openAddBreakpoint"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        class="w-64"
        side="left"
        align="start"
        :title="t('breakpoints.addTitle')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="keepAddBreakpointPopoverOpen"
      >
        <BreakpointForm
          :model-value="addBreakpointDraft"
          :error="addBreakpointError"
          :submit-label="t('common.add')"
          @update:model-value="(value) => { addBreakpointDraft = value; addBreakpointError = '' }"
          @submit="submitAddBreakpoint"
          @cancel="onAddBreakpointOpenChange(false)"
        />
      </PopoverContent>
    </Popover>

    <!-- State -->
    <div class="flex flex-col gap-1 min-w-0">
      <span :class="fieldLabel">{{ t('style.state') }}</span>
      <Select
        :model-value="state"
        @update:model-value="value => emit('update:state', value as StateKey)"
      >
        <SelectTrigger :aria-label="t('style.state')">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in stateOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
