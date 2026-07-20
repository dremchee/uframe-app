<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Component } from 'vue'
import type { FilterEntry, FilterFnType } from '@/core'
import {
  Aperture,
  Blend,
  Contrast,
  Droplet,
  Droplets,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Layers,
  Palette,
  Square,
  Sun,
  Trash2,
} from '@lucide/vue'
import { computed, ref, toRef } from 'vue'
import {
  ColorInput,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { defaultFilter, FILTER_FN_META, FILTER_FN_TYPES } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useRowReorderDnd } from '@/vue/composables/dnd/useRowReorderDnd'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'
import EffectSliderRow from './EffectSliderRow.vue'

const props = defineProps<{
  entry: FilterEntry
  index: number
  /** Popover header — names the control (e.g. "Filter" / "Backdrop filter"). */
  title?: string
  /** Which side the editor popover opens toward (away from the docked panel). */
  side?: 'top' | 'right' | 'bottom' | 'left'
}>()

const emit = defineEmits<{
  update: [index: number, entry: FilterEntry]
  remove: [index: number]
  reorder: [from: number, to: number]
}>()
const { t } = useUframeI18n()

const ICONS: Record<FilterFnType, Component> = {
  'blur': Droplets,
  'brightness': Sun,
  'contrast': Contrast,
  'saturate': Droplet,
  'grayscale': Aperture,
  'invert': Blend,
  'sepia': Image,
  'opacity': Layers,
  'hue-rotate': Palette,
  'drop-shadow': Square,
}

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)
const open = ref(false)

// Hug the docked panel's edge (if a host provided one) so the popover sits flush
// to the panel on the canvas side instead of overlapping the inset row.
const { anchor, reference: popoverReference } = usePanelEdgePopover(el)
const popoverSide = computed(() => anchor?.side ?? props.side ?? 'left')

useRowReorderDnd({
  dragType: 'application/x-uf-filter',
  el,
  handle,
  index: toRef(props, 'index'),
  onReorder: (from, to) => emit('reorder', from, to),
  setEdge: value => (edge.value = value),
  setDragging: value => (dragging.value = value),
})

function patch(p: Partial<FilterEntry>) {
  emit('update', props.index, { ...props.entry, ...p })
}

function changeType(type: FilterFnType) {
  // Reset to the new type's defaults but keep identity + visibility.
  emit('update', props.index, { ...defaultFilter(type), id: props.entry.id, enabled: props.entry.enabled })
}

/** Per-type label for the single-value control (matches the design mocks). */
function amountLabel(type: FilterFnType): string {
  if (type === 'blur')
    return t('style.radius')
  if (type === 'hue-rotate')
    return t('style.angle')
  return t('style.amount')
}

const filterLabelKeys: Record<FilterFnType, string> = {
  'blur': 'style.filterBlur',
  'brightness': 'style.filterBrightness',
  'contrast': 'style.filterContrast',
  'saturate': 'style.filterSaturate',
  'grayscale': 'style.filterGrayscale',
  'invert': 'style.filterInvert',
  'sepia': 'style.filterSepia',
  'opacity': 'style.filterOpacity',
  'hue-rotate': 'style.filterHueRotate',
  'drop-shadow': 'style.filterDropShadow',
}

function localizedFilterLabel(type: FilterFnType): string {
  return t(filterLabelKeys[type])
}

function localizedFilterSummary(entry: FilterEntry): string {
  if (entry.type === 'drop-shadow')
    return `${localizedFilterLabel(entry.type)}: ${entry.x ?? 0}px ${entry.y ?? 0}px ${entry.blur ?? 0}px`
  return `${localizedFilterLabel(entry.type)}: ${entry.amount ?? 0}${FILTER_FN_META[entry.type].unit ?? ''}`
}
</script>

<template>
  <div
    ref="el"
    class="group relative rounded-md border bg-uf-panel shadow-xs transition-[opacity,border-color]"
    :class="[
      dragging ? 'opacity-40 border-uf-accent' : 'border-uf-border',
      edge === 'top' ? 'before:absolute before:content-[\'\'] before:-top-0.5 before:inset-x-1 before:h-0.5 before:rounded-full before:bg-uf-accent' : '',
      edge === 'bottom' ? 'after:absolute after:content-[\'\'] after:-bottom-0.5 after:inset-x-1 after:h-0.5 after:rounded-full after:bg-uf-accent' : '',
    ]"
  >
    <div class="flex items-center gap-1.5 pl-1.5 pr-1 h-9" :class="entry.enabled ? '' : 'opacity-50'">
      <button
        ref="handle"
        type="button"
        class="shrink-0 cursor-grab text-uf-muted hover:text-uf-text active:cursor-grabbing"
        :aria-label="t('style.dragReorder')"
      >
        <GripVertical :size="13" :stroke-width="1.75" />
      </button>

      <Popover :open="open" @update:open="value => (open = value)">
        <PopoverTrigger class="flex min-w-0 flex-1 items-center gap-1.5 text-left" :aria-label="t('style.editFilter', { label: localizedFilterLabel(entry.type) })">
          <component :is="ICONS[entry.type]" :size="14" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
          <span class="min-w-0 flex-1 truncate text-xs text-uf-text" :title="localizedFilterSummary(entry)">{{ localizedFilterSummary(entry) }}</span>
        </PopoverTrigger>
        <PopoverContent
          class="w-75"
          body-class="flex flex-col gap-2.5"
          :side="popoverSide"
          :reference="popoverReference"
          align="start"
          :title="t('style.filter')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(e: Event) => e.preventDefault()"
        >
          <div class="text-sm font-semibold text-uf-text">
            {{ props.title ?? t('style.filter') }}
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-uf-muted">{{ t('style.filter') }}</span>
            <Select :model-value="entry.type" @update:model-value="value => changeType(value as FilterFnType)">
              <SelectTrigger class="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="type in FILTER_FN_TYPES" :key="type" :value="type">
                  {{ localizedFilterLabel(type) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <template v-if="entry.type === 'drop-shadow'">
            <EffectSliderRow label="X" :model-value="entry.x ?? 0" :min="-100" :max="100" unit="px" @update:model-value="v => patch({ x: v })" />
            <EffectSliderRow label="Y" :model-value="entry.y ?? 0" :min="-100" :max="100" unit="px" @update:model-value="v => patch({ y: v })" />
            <EffectSliderRow label="Blur" :model-value="entry.blur ?? 0" :min="0" :max="100" unit="px" @update:model-value="v => patch({ blur: v })" />
            <div class="flex flex-col gap-1.5">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-uf-muted">{{ t('style.color') }}</span>
              <ColorInput class="h-8 w-full" :model-value="entry.color ?? ''" placeholder="rgba(0, 0, 0, 0.7)" @update:model-value="v => patch({ color: v })" />
            </div>
          </template>

          <EffectSliderRow
            v-else
            :label="amountLabel(entry.type)"
            :model-value="entry.amount ?? 0"
            :min="FILTER_FN_META[entry.type].min"
            :max="FILTER_FN_META[entry.type].max"
            :step="FILTER_FN_META[entry.type].step"
            :unit="FILTER_FN_META[entry.type].unit"
            @update:model-value="v => patch({ amount: v })"
          />
        </PopoverContent>
      </Popover>

      <IconButton
        size="sm"
        :aria-label="entry.enabled ? t('style.hideFilter') : t('style.showFilter')"
        @click="patch({ enabled: !entry.enabled })"
      >
        <Eye v-if="entry.enabled" :size="13" :stroke-width="1.75" />
        <EyeOff v-else :size="13" :stroke-width="1.75" />
      </IconButton>
      <IconButton size="sm" :aria-label="t('style.deleteFilter')" @click="emit('remove', index)">
        <Trash2 :size="13" :stroke-width="1.75" />
      </IconButton>
    </div>
  </div>
</template>
