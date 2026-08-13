<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import StyleField from '@/vue/components/style-panel/StyleField.vue'
import { useUframeI18n } from '@/vue/i18n'
import { ANCHOR_PLACEMENTS, anchorFlipState, composeAnchorFallbacks } from './anchor-css'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  update: [patch: Partial<BaseBlockStyles>]
}>()

const { t } = useUframeI18n()
const placementCells: Record<string, string> = {
  'top left': 'col-start-1 row-start-1',
  'top': 'col-start-2 row-start-1',
  'top right': 'col-start-3 row-start-1',
  'left': 'col-start-1 row-start-2',
  'right': 'col-start-3 row-start-2',
  'bottom left': 'col-start-1 row-start-3',
  'bottom': 'col-start-2 row-start-3',
  'bottom right': 'col-start-3 row-start-3',
}
const flips = computed(() => anchorFlipState(props.modelValue.positionTryFallbacks))

function setPlacement(value: string) {
  emit('update', { positionArea: props.modelValue.positionArea === value ? undefined : value })
}

function setFlip(axis: 'block' | 'inline', enabled: boolean) {
  emit('update', {
    positionTryFallbacks: composeAnchorFallbacks(
      axis === 'block' ? enabled : flips.value['flip-block'],
      axis === 'inline' ? enabled : flips.value['flip-inline'],
    ),
  })
}

function optionalValue(value: unknown): string | undefined {
  const next = String(value)
  return next === 'normal' ? undefined : next
}
</script>

<template>
  <div class="grid gap-2.5">
    <StyleField :label="t('cssAnchor.placement')" field="positionArea">
      <div class="mx-auto grid size-32 grid-cols-3 grid-rows-3 gap-1 rounded-lg bg-uf-panel-muted p-1.5">
        <button
          v-for="placement in ANCHOR_PLACEMENTS"
          :key="placement"
          type="button"
          :class="cn(
            'grid min-h-0 min-w-0 place-items-center rounded border transition-colors',
            placementCells[placement],
            modelValue.positionArea === placement
              ? 'border-uf-accent bg-uf-accent text-uf-accent-foreground'
              : 'border-uf-border bg-uf-panel hover:border-uf-accent/60 hover:bg-uf-accent/10',
          )"
          :aria-label="t('cssAnchor.placementValue', { value: placement })"
          :aria-pressed="modelValue.positionArea === placement"
          @click="setPlacement(placement)"
        >
          <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
        </button>
        <div class="col-start-2 row-start-2 grid place-items-center rounded border border-dashed border-uf-muted bg-uf-panel">
          <span class="size-3 rounded-sm bg-uf-muted" aria-hidden="true" />
        </div>
      </div>
    </StyleField>

    <div class="grid gap-2">
      <div class="text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
        {{ t('cssAnchor.overflowFallbacks') }}
      </div>
      <Switch :model-value="flips['flip-block']" @update:model-value="value => setFlip('block', value)">
        {{ t('cssAnchor.flipBlock') }}
      </Switch>
      <Switch :model-value="flips['flip-inline']" @update:model-value="value => setFlip('inline', value)">
        {{ t('cssAnchor.flipInline') }}
      </Switch>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <StyleField :label="t('cssAnchor.visibility')" field="positionVisibility">
        <Select
          :model-value="modelValue.positionVisibility ?? 'normal'"
          @update:model-value="value => emit('update', { positionVisibility: optionalValue(value) })"
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">
              {{ t('cssAnchor.normal') }}
            </SelectItem>
            <SelectItem value="always">
              {{ t('cssAnchor.always') }}
            </SelectItem>
            <SelectItem value="anchor-visible">
              {{ t('cssAnchor.anchorVisible') }}
            </SelectItem>
            <SelectItem value="anchor-valid">
              {{ t('cssAnchor.anchorValid') }}
            </SelectItem>
            <SelectItem value="no-overflow">
              {{ t('cssAnchor.noOverflow') }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('cssAnchor.tryOrder')" field="positionTryOrder">
        <Select
          :model-value="modelValue.positionTryOrder ?? 'normal'"
          @update:model-value="value => emit('update', { positionTryOrder: optionalValue(value) })"
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">
              {{ t('cssAnchor.normal') }}
            </SelectItem>
            <SelectItem value="most-width">
              {{ t('cssAnchor.mostWidth') }}
            </SelectItem>
            <SelectItem value="most-height">
              {{ t('cssAnchor.mostHeight') }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
  </div>
</template>
