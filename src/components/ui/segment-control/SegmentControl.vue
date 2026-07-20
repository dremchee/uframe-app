<script setup lang="ts" generic="T extends string">
import type { Component } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

export interface SegmentOption<V extends string> {
  value: V
  label: string
  /** When set, the icon is shown instead of the label text (label → tooltip). */
  icon?: Component
  /** Secondary right-aligned text in the overflow menu (e.g. a resolution). */
  hint?: string
}

const props = defineProps<{
  modelValue: T
  options: Array<SegmentOption<T>>
  /**
   * Options tucked behind a dropdown rendered as the track's last segment.
   * While one of them is selected no tab matches, so the trigger carries the
   * selection instead: active styling + the option's glyph + a small chevron.
   */
  overflow?: Array<SegmentOption<T>>
  ariaLabel?: string
  /** Accessible label of the overflow trigger (e.g. "More breakpoints"). */
  overflowLabel?: string
  /** Show the label text alongside the icon (otherwise label → tooltip only). */
  showLabels?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
const { t } = useUframeI18n()

const activeOverflow = computed(() =>
  props.overflow?.find(opt => opt.value === props.modelValue),
)

// Mirrors TabsTrigger (the overflow trigger is not a tab, so it can't get the
// data-state styling for free).
const overflowTriggerClass = computed(() => cn(
  'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-2 py-1 h-[calc(100%-1px)] gap-1.5',
  'text-sm font-medium cursor-pointer transition-all',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  activeOverflow.value
    ? 'bg-background text-foreground shadow-xs'
    : 'text-muted-foreground hover:text-foreground',
))
</script>

<template>
  <Tabs
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value as T)"
  >
    <TabsList
      class="flex h-9 items-center gap-0 p-0.75"
      :aria-label="ariaLabel"
    >
      <template v-for="opt in options" :key="opt.value">
        <!-- Tooltip only in icon-only mode; when the label is visible it's redundant. -->
        <Tooltip v-if="!showLabels" :text="opt.label">
          <TabsTrigger
            :value="opt.value"
            :aria-label="opt.label"
            class="flex-1 h-[calc(100%-1px)] gap-1.5 border border-transparent data-[state=active]:shadow-sm bg-transparent"
          >
            <slot name="option" :option="opt" :active="modelValue === opt.value">
              <component
                :is="opt.icon"
                v-if="opt.icon"
                :size="14"
                :stroke-width="2"
              />
              <span v-if="!opt.icon" class="truncate">{{ opt.label }}</span>
            </slot>
          </TabsTrigger>
        </Tooltip>
        <TabsTrigger
          v-else
          :value="opt.value"
          :aria-label="opt.label"
          class="flex-1 h-[calc(100%-1px)] gap-1.5 border border-transparent data-[state=active]:shadow-sm bg-transparent"
        >
          <slot name="option" :option="opt" :active="modelValue === opt.value">
            <component
              :is="opt.icon"
              v-if="opt.icon"
              :size="14"
              :stroke-width="2"
            />
            <span class="truncate">{{ opt.label }}</span>
          </slot>
        </TabsTrigger>
      </template>

      <DropdownMenu v-if="overflow?.length || $slots['overflow-footer']">
        <DropdownMenuTrigger>
          <button
            type="button"
            :class="overflowTriggerClass"
            :aria-label="activeOverflow ? activeOverflow.label : (overflowLabel ?? t('common.moreOptions'))"
          >
            <template v-if="activeOverflow">
              <slot name="option" :option="activeOverflow" :active="true">
                <component
                  :is="activeOverflow.icon"
                  v-if="activeOverflow.icon"
                  :size="14"
                  :stroke-width="2"
                />
                <span v-else class="truncate">{{ activeOverflow.label }}</span>
              </slot>
              <ChevronDown :size="11" :stroke-width="2" class="-mr-1 opacity-60" aria-hidden="true" />
            </template>
            <ChevronDown v-else :size="14" :stroke-width="2" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-36">
          <DropdownMenuItem
            v-for="opt in overflow"
            :key="opt.value"
            :class="modelValue === opt.value ? 'text-uf-accent' : ''"
            @select="emit('update:modelValue', opt.value)"
          >
            <slot name="overflow-item" :option="opt" :active="modelValue === opt.value">
              <component
                :is="opt.icon"
                v-if="opt.icon"
                :size="14"
                :stroke-width="1.75"
              />
              <span class="flex-1">{{ opt.label }}</span>
              <span v-if="opt.hint" class="text-[11px] tabular-nums text-uf-muted">{{ opt.hint }}</span>
            </slot>
          </DropdownMenuItem>
          <slot name="overflow-footer" />
        </DropdownMenuContent>
      </DropdownMenu>
    </TabsList>
  </Tabs>
</template>
