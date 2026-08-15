<script setup lang="ts">
import type { Component } from 'vue'
import type { BreakpointDef, StyleViewport } from '@/core'
import { Ellipsis, Monitor } from '@lucide/vue'
import { computed } from 'vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tabs, TabsList, TabsTrigger, Tooltip } from '@/components/ui'
import { breakpointRangeLabel, breakpointUpperBound } from '@/core'
import { cn } from '@/lib/utils'
import { breakpointIcon } from '@/vue/components/breakpoint-icons'
import BreakpointAddMenuItem from '@/vue/components/BreakpointAddMenuItem.vue'
import { useUframeI18n } from '@/vue/i18n'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

const props = withDefaults(defineProps<{
  modelValue: StyleViewport
  breakpoints: BreakpointDef[]
  /** Compact, transparent presentation for editor toolbar regions. */
  compact?: boolean
  /** Override the overflow icon when a context needs a different action glyph. */
  overflowIcon?: Component
}>(), {
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: StyleViewport]
  'add': []
}>()

const { t } = useUframeI18n()

interface DeviceOption {
  value: StyleViewport
  label: string
  icon: Component
}

const tabletBreakpoint = computed(() =>
  props.breakpoints
    .filter(breakpoint => breakpoint.direction !== 'min' && breakpointUpperBound(breakpoint) > 768 && breakpointUpperBound(breakpoint) <= 1024)
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))[0],
)
const mobileBreakpoint = computed(() =>
  props.breakpoints
    .filter(breakpoint => breakpoint.direction !== 'min' && breakpointUpperBound(breakpoint) <= 768)
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))[0],
)

const deviceOptions = computed<DeviceOption[]>(() => {
  const options: DeviceOption[] = [{ value: 'base', label: `${t('style.desktop')} · ${t('style.allWidths')}`, icon: Monitor }]
  if (tabletBreakpoint.value)
    options.push({ value: tabletBreakpoint.value.id, label: `${t('style.tablet')} · ${breakpointRangeLabel(tabletBreakpoint.value)}`, icon: breakpointIcon(tabletBreakpoint.value) })
  if (mobileBreakpoint.value)
    options.push({ value: mobileBreakpoint.value.id, label: `${t('style.mobile')} · ${breakpointRangeLabel(mobileBreakpoint.value)}`, icon: breakpointIcon(mobileBreakpoint.value) })
  return options
})

const overflowOptions = computed(() => {
  const visibleValues = new Set(deviceOptions.value.map(option => option.value))
  return props.breakpoints
    .filter(breakpoint => !visibleValues.has(breakpoint.id))
    .map(breakpoint => ({
      value: breakpoint.id,
      label: breakpointLabel(breakpoint, t),
      hint: breakpointRangeLabel(breakpoint),
      icon: breakpointIcon(breakpoint),
    }))
})

const activeOverflow = computed(() =>
  overflowOptions.value.find(option => option.value === props.modelValue),
)
const resolvedOverflowIcon = computed(() => props.overflowIcon ?? Ellipsis)
const tabsListClass = computed(() => cn(
  'flex items-center gap-0',
  props.compact ? 'h-7 bg-transparent p-0' : 'h-9 rounded-lg bg-muted p-0.75',
))
const tabClass = computed(() => cn(
  'flex-1 gap-1.5 border border-transparent bg-transparent',
  props.compact
    ? 'size-7 rounded-md p-0 data-[state=active]:bg-uf-accent/10 data-[state=active]:text-uf-accent'
    : 'h-[calc(100%-1px)] rounded-md data-[state=active]:bg-uf-accent/10 data-[state=active]:text-uf-accent',
))
const overflowTriggerClass = computed(() => cn(
  'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  props.compact ? 'size-7 p-0 text-uf-muted hover:bg-uf-panel-muted hover:text-uf-text' : 'h-[calc(100%-1px)] gap-1.5 px-2 py-1',
  activeOverflow.value
    ? 'bg-uf-accent/10 text-uf-accent'
    : 'text-muted-foreground hover:text-foreground',
))
</script>

<template>
  <Tabs :model-value="modelValue" @update:model-value="emit('update:modelValue', String($event))">
    <TabsList :class="tabsListClass" :aria-label="t('style.breakpoint')">
      <Tooltip v-for="option in deviceOptions" :key="option.value" :text="option.label">
        <TabsTrigger :value="option.value" :aria-label="option.label" :class="tabClass">
          <component :is="option.icon" :size="14" :stroke-width="props.compact ? 1.75 : 2" />
        </TabsTrigger>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button type="button" :class="overflowTriggerClass" :aria-label="activeOverflow?.label ?? t('style.moreBreakpoints')">
            <template v-if="activeOverflow">
              <component :is="activeOverflow.icon" :size="14" :stroke-width="1.75" />
              <component :is="resolvedOverflowIcon" :size="11" :stroke-width="2" class="-mr-1 opacity-60" aria-hidden="true" />
            </template>
            <component :is="resolvedOverflowIcon" v-else :size="props.compact ? 15 : 14" :stroke-width="2" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-36">
          <DropdownMenuItem
            v-for="option in overflowOptions"
            :key="option.value"
            :class="modelValue === option.value ? 'text-uf-accent' : ''"
            @select="emit('update:modelValue', option.value)"
          >
            <component :is="option.icon" :size="14" :stroke-width="1.75" />
            <span class="flex-1">{{ option.label }}</span>
            <span class="text-[11px] tabular-nums text-uf-muted">{{ option.hint }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="overflowOptions.length" />
          <BreakpointAddMenuItem @select="emit('add')" />
        </DropdownMenuContent>
      </DropdownMenu>
    </TabsList>
  </Tabs>
</template>
