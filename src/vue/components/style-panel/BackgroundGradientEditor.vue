<script setup lang="ts">
import type { SegmentOption } from '@/components/ui'
import type { GradientValue, RadialShape } from '@/core'
import { Plus, Trash2 } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import {
  Button,
  ColorInput,
  IconButton,
  SegmentControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SizeInput,
} from '@/components/ui'
import { RADIAL_POSITIONS, serializeGradient } from '@/core'
import { useGradientStops } from '@/vue/composables/style/useGradientStops'
import { useVariableResolver } from '@/vue/composables/style/useVariableResolver'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import EffectSliderRow from './EffectSliderRow.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: GradientValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: GradientValue]
}>()

const { t } = useUframeI18n()
const gradient = computed(() => props.modelValue)

const radialPositionOptions = RADIAL_POSITIONS
const shapeOptions: Array<SegmentOption<RadialShape>> = [
  { value: 'circle', label: t('style.radialCircle') },
  { value: 'ellipse', label: t('style.radialEllipse') },
]
const percentUnit = [{ value: '%', label: '%' }]

// Resolve `var(--x)` stop colours for previews outside the page scope while
// preserving the original references in the emitted gradient value.
const { resolve } = useVariableResolver()
function resolvedStops(value: GradientValue): GradientValue {
  return { ...value, stops: value.stops.map(stop => ({ ...stop, color: resolve(stop.color) || stop.color })) }
}
const gradientCss = computed(() => serializeGradient(resolvedStops(gradient.value)))
const stopTrackCss = computed(() =>
  `linear-gradient(to right, ${resolvedStops(gradient.value).stops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`,
)

function updateGradient(next: GradientValue) {
  emit('update:modelValue', next)
}
function setAngle(angle: number) {
  const current = gradient.value
  if (current.type === 'linear')
    updateGradient({ ...current, angle: Math.round(angle) })
}
function setShape(shape: RadialShape) {
  const current = gradient.value
  if (current.type === 'radial')
    updateGradient({ ...current, shape })
}
function setRadialPosition(position: string) {
  const current = gradient.value
  if (current.type === 'radial')
    updateGradient({ ...current, position })
}

const trackRef = useTemplateRef<HTMLElement>('trackRef')
const {
  activeStop,
  selectedStop,
  setStopColor,
  setStopPosition,
  sortStops,
  addStop,
  removeStop,
  onHandlePointerDown,
  onTrackPointerDown,
  onTrackPointerMove,
  onTrackPointerUp,
} = useGradientStops({ gradient, track: trackRef, update: updateGradient })
</script>

<template>
  <div class="flex flex-col gap-3 min-w-0">
    <div class="h-14 rounded-md ring-1 ring-inset ring-black/10" :style="{ background: gradientCss }" />

    <StyleField v-if="gradient.type === 'linear'" :label="t('style.angle')">
      <EffectSliderRow
        :model-value="gradient.angle"
        :min="0"
        :max="360"
        unit="deg"
        @update:model-value="setAngle"
      />
    </StyleField>

    <template v-else>
      <StyleField :label="t('style.shape')">
        <SegmentControl
          :model-value="gradient.shape"
          :options="shapeOptions"
          show-labels
          :aria-label="t('style.radialShape')"
          @update:model-value="setShape"
        />
      </StyleField>
      <StyleField :label="t('style.gradientPosition')">
        <Select :model-value="gradient.position" @update:model-value="value => setRadialPosition(String(value))">
          <SelectTrigger><SelectValue placeholder="center" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in radialPositionOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </template>

    <StyleField :label="t('style.stops')">
      <div class="flex flex-col gap-1.5 min-w-0">
        <div
          ref="trackRef"
          class="relative h-6 rounded-md ring-1 ring-inset ring-black/10 cursor-copy touch-none select-none"
          :style="{ background: stopTrackCss }"
          @pointerdown.prevent="onTrackPointerDown"
          @pointermove="onTrackPointerMove"
          @pointerup="onTrackPointerUp"
        >
          <button
            v-for="(stop, index) in gradient.stops"
            :key="stop.id"
            type="button"
            class="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30 cursor-ew-resize"
            :class="index === activeStop ? 'ring-2 ring-uf-accent z-10' : ''"
            :style="{ left: `${stop.position}%`, backgroundColor: resolve(stop.color) || stop.color }"
            :aria-label="t('style.stopAria', { n: index + 1 })"
            :title="t('style.stopHint')"
            @pointerdown.stop.prevent="onHandlePointerDown(index, $event)"
          />
        </div>
        <div
          v-for="(stop, index) in gradient.stops"
          :key="stop.id"
          class="flex items-center gap-1.5 min-w-0 rounded-md"
          @pointerdown="selectedStop = index"
        >
          <span
            class="w-1 self-stretch shrink-0 rounded-full transition-colors"
            :class="index === activeStop ? 'bg-uf-accent' : 'bg-transparent'"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <BindableField type="color" icon-trigger :model-value="stop.color" @update:model-value="value => setStopColor(index, value)">
              <template #default="{ value, setValue }">
                <ColorInput end-action :model-value="value" placeholder="#000000" @update:model-value="value => setValue(String(value))" />
              </template>
            </BindableField>
          </div>
          <SizeInput
            class="w-20 shrink-0"
            :model-value="`${stop.position}%`"
            :units="percentUnit"
            default-unit="%"
            :min="0"
            @update:model-value="value => setStopPosition(index, value)"
            @focusout="sortStops"
          />
          <IconButton :disabled="gradient.stops.length <= 2" :aria-label="t('style.removeStop')" @click="removeStop(index)">
            <Trash2 :size="13" :stroke-width="1.75" />
          </IconButton>
        </div>
        <Button variant="subtle" size="sm" class="w-full" :icon="Plus" @click="addStop">
          {{ t('style.addStop') }}
        </Button>
      </div>
    </StyleField>
  </div>
</template>
