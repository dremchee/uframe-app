<script setup lang="ts">
import type { Component } from 'vue'
import type { SegmentOption } from '@/components/ui'
import type { BreakpointDirection } from '@/core'
import { ChevronsLeft, ChevronsRight, CircleAlert, MoveHorizontal } from '@lucide/vue'
import { Alert, AlertDescription, Button, Input, NumberField, NumberFieldInput, SegmentControl } from '@/components/ui'
import { BREAKPOINT_ICONS } from '@/vue/components/breakpoint-icons'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  modelValue: BreakpointDraft
  submitLabel?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BreakpointDraft]
  'submit': []
  'cancel': []
}>()

const { t } = useUframeI18n()

const iconLabelKeys: Record<string, string> = {
  'monitor': 'breakpoints.iconDesktop',
  'tv': 'breakpoints.iconTv',
  'laptop': 'breakpoints.iconLaptop',
  'tablet': 'breakpoints.iconTablet',
  'tablet-landscape': 'breakpoints.iconTabletLandscape',
  'smartphone': 'breakpoints.iconPhone',
}

export interface BreakpointDraft {
  label: string
  direction: BreakpointDirection
  width: number
  widthMax?: number
  /** Device-icon key (see BREAKPOINT_ICONS). */
  icon: string
}

const iconOptions: Array<SegmentOption<string> & { icon: Component }> = BREAKPOINT_ICONS.map(i => ({
  value: i.key,
  label: t(iconLabelKeys[i.key] ?? 'breakpoints.icon'),
  icon: i.icon,
}))

const directions: Array<SegmentOption<BreakpointDirection> & { icon: Component }> = [
  { value: 'max', icon: ChevronsLeft, label: t('breakpoints.dirMax') },
  { value: 'between', icon: MoveHorizontal, label: t('breakpoints.dirBetween') },
  { value: 'min', icon: ChevronsRight, label: t('breakpoints.dirMin') },
]

function patch(part: Partial<BreakpointDraft>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}

function selectDirection(direction: BreakpointDirection) {
  // Seed an upper bound the first time `between` is picked.
  if (direction === 'between' && props.modelValue.widthMax === undefined)
    patch({ direction, widthMax: Math.round(props.modelValue.width * 1.5) })
  else
    patch({ direction })
}

const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'
const fieldBox = 'inline-flex items-center h-9 rounded-md border border-input bg-transparent pl-3 pr-2 text-sm shadow-xs focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent'
const fieldInput = 'w-full bg-transparent text-right tabular-nums outline-none'
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="emit('submit')">
    <label class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('breakpoints.name') }}</span>
      <Input
        :model-value="modelValue.label"
        spellcheck="false"
        :placeholder="t('breakpoints.namePlaceholder')"
        :aria-label="t('breakpoints.name')"
        autofocus
        @update:model-value="(v) => patch({ label: String(v) })"
      />
    </label>

    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('breakpoints.applies') }}</span>
      <SegmentControl
        :model-value="modelValue.direction"
        :options="directions"
        :aria-label="t('breakpoints.direction')"
        @update:model-value="selectDirection"
      />
    </div>

    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('breakpoints.icon') }}</span>
      <SegmentControl
        :model-value="modelValue.icon"
        :options="iconOptions"
        :aria-label="t('breakpoints.icon')"
        @update:model-value="(v) => patch({ icon: v })"
      />
    </div>

    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ modelValue.direction === 'between' ? t('breakpoints.widthRange') : t('breakpoints.width') }}</span>
      <div class="flex items-center gap-1">
        <NumberField
          :model-value="modelValue.width"
          :min="1"
          class="flex-1"
          @update:model-value="(v) => patch({ width: Math.round(v) })"
        >
          <div :class="fieldBox">
            <NumberFieldInput :class="fieldInput" :aria-label="modelValue.direction === 'between' ? t('breakpoints.fromWidth') : t('breakpoints.width')" />
            <span class="ml-0.5 text-uf-muted">px</span>
          </div>
        </NumberField>

        <template v-if="modelValue.direction === 'between'">
          <span class="shrink-0 text-uf-muted">–</span>
          <NumberField
            :model-value="modelValue.widthMax ?? modelValue.width"
            :min="modelValue.width + 1"
            class="flex-1"
            @update:model-value="(v) => patch({ widthMax: Math.round(v) })"
          >
            <div :class="fieldBox">
              <NumberFieldInput :class="fieldInput" :aria-label="t('breakpoints.toWidth')" />
              <span class="ml-0.5 text-uf-muted">px</span>
            </div>
          </NumberField>
        </template>
      </div>
    </div>

    <Alert v-if="error" variant="destructive" class="px-3 py-2 text-xs">
      <CircleAlert :size="14" :stroke-width="2" />
      <AlertDescription class="text-xs text-destructive">
        {{ error }}
      </AlertDescription>
    </Alert>

    <div class="flex justify-end gap-2 pt-0.5">
      <Button type="button" variant="ghost" size="sm" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" size="sm">
        {{ submitLabel ?? t('common.save') }}
      </Button>
    </div>
  </form>
</template>
