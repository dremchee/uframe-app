<script setup lang="ts">
import type { Component } from 'vue'
import type { SegmentOption } from '@/components/ui'
import type { BreakpointDef, StyleState, StyleViewport } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import { Monitor, Plus } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  Popover,
  PopoverAnchor,
  PopoverContent,
  SegmentControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { breakpointRangeLabel, breakpointUpperBound } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { autoIconKey, breakpointIcon } from '@/vue/components/breakpoint-icons'
import BreakpointForm from '@/vue/components/BreakpointForm.vue'
import { useUframeI18n } from '@/vue/i18n'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

export type ViewportKey = StyleViewport
export type StateKey = 'default' | StyleState

interface ViewportOption {
  value: ViewportKey
  label: string
  icon: Component
  /** Human-readable resolution, e.g. `≤1024px` or `600–900px`. */
  res: string
}

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

// Representative tablet / mobile breakpoints (mobile-down tiers). min
// (desktop-up) breakpoints never fill a device slot — they go in the menu.
const tabletBp = computed(() =>
  props.breakpoints
    .filter(b => b.direction !== 'min' && breakpointUpperBound(b) > 768 && breakpointUpperBound(b) <= 1024)
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))[0],
)
const mobileBp = computed(() =>
  props.breakpoints
    .filter(b => b.direction !== 'min' && breakpointUpperBound(b) <= 768)
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))[0],
)

// The three base resolutions — desktop (base), tablet, mobile. The tooltip
// label carries the resolution (`Tablet · ≤1024px`) since segments render
// icon-only.
const deviceSlots = computed<ViewportOption[]>(() => {
  const slots: ViewportOption[] = [{ value: 'base', label: t('style.desktop'), icon: Monitor, res: t('style.allWidths') }]
  if (tabletBp.value)
    slots.push({ value: tabletBp.value.id, label: t('style.tablet'), icon: breakpointIcon(tabletBp.value), res: breakpointRangeLabel(tabletBp.value) })
  if (mobileBp.value)
    slots.push({ value: mobileBp.value.id, label: t('style.mobile'), icon: breakpointIcon(mobileBp.value), res: breakpointRangeLabel(mobileBp.value) })
  return slots
})
const deviceSegments = computed<Array<SegmentOption<string>>>(() =>
  deviceSlots.value.map(opt => ({ value: opt.value, label: `${opt.label} · ${opt.res}`, icon: opt.icon })),
)

// Everything not promoted to a device slot lives in the overflow menu; the
// resolution renders right-aligned via SegmentOption.hint.
const overflowSegments = computed<Array<SegmentOption<string>>>(() => {
  const used = new Set(deviceSlots.value.map(s => s.value))
  return props.breakpoints
    .filter(b => !used.has(b.id))
    .map(b => ({ value: b.id, label: breakpointLabel(b, t), icon: breakpointIcon(b), hint: breakpointRangeLabel(b) }))
})

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
          <SegmentControl
            :model-value="viewport"
            :options="deviceSegments"
            :overflow="overflowSegments"
            :aria-label="t('style.breakpoint')"
            :overflow-label="t('style.moreBreakpoints')"
            @update:model-value="value => emit('update:viewport', value)"
          >
            <template #overflow-footer>
              <DropdownMenuSeparator v-if="overflowSegments.length" />
              <DropdownMenuItem @select="openAddBreakpoint">
                <Plus :size="14" :stroke-width="1.75" />
                {{ t('breakpoints.add') }}
              </DropdownMenuItem>
            </template>
          </SegmentControl>
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
