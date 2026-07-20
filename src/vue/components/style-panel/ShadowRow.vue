<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { SegmentOption } from '@/components/ui'
import type { ShadowEntry } from '@/core'
import { Eye, EyeOff, GripVertical, Trash2 } from '@lucide/vue'
import { computed, ref, toRef } from 'vue'
import { ColorInput, IconButton, Popover, PopoverContent, PopoverTrigger, SegmentControl } from '@/components/ui'
import { shadowSummary } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useRowReorderDnd } from '@/vue/composables/dnd/useRowReorderDnd'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'
import EffectSliderRow from './EffectSliderRow.vue'

const props = defineProps<{
  entry: ShadowEntry
  index: number
  /** Which side the editor popover opens toward (away from the docked panel). */
  side?: 'top' | 'right' | 'bottom' | 'left'
}>()

const emit = defineEmits<{
  update: [index: number, entry: ShadowEntry]
  remove: [index: number]
  reorder: [from: number, to: number]
}>()
const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)
const open = ref(false)

const typeOptions = computed<Array<SegmentOption<string>>>(() => [
  { value: 'outside', label: t('style.outside') },
  { value: 'inside', label: t('style.inside') },
])

// Hug the docked panel's edge (if a host provided one) so the popover sits flush
// to the panel on the canvas side instead of overlapping the inset row.
const { anchor, reference: popoverReference } = usePanelEdgePopover(el)
const popoverSide = computed(() => anchor?.side ?? props.side ?? 'left')

useRowReorderDnd({
  dragType: 'application/x-uf-shadow',
  el,
  handle,
  index: toRef(props, 'index'),
  onReorder: (from, to) => emit('reorder', from, to),
  setEdge: value => (edge.value = value),
  setDragging: value => (dragging.value = value),
})

function patch(p: Partial<ShadowEntry>) {
  emit('update', props.index, { ...props.entry, ...p })
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
        <PopoverTrigger class="flex min-w-0 flex-1 items-center gap-1.5 text-left" :aria-label="t('style.editShadow')">
          <span class="shrink-0 size-4 rounded-sm border border-input" :style="{ backgroundColor: entry.color || 'transparent' }" />
          <span class="min-w-0 flex-1 truncate text-xs text-uf-text" :title="shadowSummary(entry)">{{ shadowSummary(entry) }}</span>
        </PopoverTrigger>
        <PopoverContent
          class="w-75"
          body-class="flex flex-col gap-2.5"
          :side="popoverSide"
          :reference="popoverReference"
          align="start"
          :title="t('style.shadow')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(e: Event) => e.preventDefault()"
        >
          <div class="text-sm font-semibold text-uf-text">
            {{ t('style.boxShadows') }}
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-uf-muted">{{ t('style.type') }}</span>
            <SegmentControl
              :model-value="entry.inset ? 'inside' : 'outside'"
              :options="typeOptions"
              show-labels
              :aria-label="t('style.shadowType')"
              @update:model-value="value => patch({ inset: value === 'inside' })"
            />
          </div>
          <EffectSliderRow label="X" :model-value="entry.x ?? 0" :min="-100" :max="100" unit="px" @update:model-value="v => patch({ x: v })" />
          <EffectSliderRow label="Y" :model-value="entry.y ?? 0" :min="-100" :max="100" unit="px" @update:model-value="v => patch({ y: v })" />
          <EffectSliderRow label="Blur" :model-value="entry.blur ?? 0" :min="0" :max="100" unit="px" @update:model-value="v => patch({ blur: v })" />
          <EffectSliderRow label="Size" :model-value="entry.spread ?? 0" :min="-100" :max="100" unit="px" @update:model-value="v => patch({ spread: v })" />
          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-uf-muted">{{ t('style.color') }}</span>
            <ColorInput class="h-8 w-full" :model-value="entry.color ?? ''" placeholder="rgba(0, 0, 0, 0.2)" @update:model-value="v => patch({ color: v })" />
          </div>
        </PopoverContent>
      </Popover>

      <IconButton
        size="sm"
        :aria-label="entry.enabled ? t('style.hideShadow') : t('style.showShadow')"
        @click="patch({ enabled: !entry.enabled })"
      >
        <Eye v-if="entry.enabled" :size="13" :stroke-width="1.75" />
        <EyeOff v-else :size="13" :stroke-width="1.75" />
      </IconButton>
      <IconButton size="sm" :aria-label="t('style.deleteShadow')" @click="emit('remove', index)">
        <Trash2 :size="13" :stroke-width="1.75" />
      </IconButton>
    </div>
  </div>
</template>
