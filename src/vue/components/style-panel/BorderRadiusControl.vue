<script setup lang="ts">
import type { BaseBlockStyles, CssLength } from '@/core'
import { Square } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SizeInput, Slider, Tooltip } from '@/components/ui'
import { parseVarRef } from '@/core'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

type RadiusKey = `border${'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight'}Radius`
type Corner = 'tl' | 'tr' | 'bl' | 'br'

const radiusMode = shallowRef<'all' | 'individual'>('all')
const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()
const radiusKeys: RadiusKey[] = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]
const cornerKey: Record<Corner, RadiusKey> = {
  tl: 'borderTopLeftRadius',
  tr: 'borderTopRightRadius',
  bl: 'borderBottomLeftRadius',
  br: 'borderBottomRightRadius',
}

function patch(patchValue: Partial<BaseBlockStyles>) {
  const next: BaseBlockStyles = { ...styles.value }
  for (const [key, value] of Object.entries(patchValue)) {
    if (value === '' || value === undefined || value === null)
      delete (next as Record<string, unknown>)[key]
    else
      (next as Record<string, unknown>)[key] = value
  }
  emit('update:modelValue', next)
}

function parseLeadingNumber(value: string | undefined): number {
  if (!value)
    return 0
  const match = /^(-?\d+(?:\.\d+)?)/.exec(value.trim())
  return match ? Number(match[1]) : 0
}

const radiusModified = computed(() => radiusKeys.some(key => styles.value[key] != null))
const activeRadius = computed<CssLength | ''>(() => styles.value.borderTopLeftRadius ?? '')
const radiusIsVar = computed(() => parseVarRef(String(activeRadius.value)) != null)
const radiusSliderValue = computed<number[]>(() => [parseLeadingNumber(activeRadius.value)])
const hasIndividualRadii = computed(() => {
  const radii = radiusKeys.map(key => styles.value[key])
  return new Set(radii.filter(value => value !== undefined)).size > 1
})

function setAllCornersRadius(value: string) {
  const radius = value || undefined
  patch({
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    borderBottomLeftRadius: radius,
    borderBottomRightRadius: radius,
  })
}

function resetRadius() {
  setAllCornersRadius('')
}

function getCornerRadius(corner: Corner): CssLength | '' {
  return styles.value[cornerKey[corner]] ?? ''
}

function setCornerRadius(corner: Corner, value: string) {
  patch({ [cornerKey[corner]]: value || undefined } as Partial<BaseBlockStyles>)
}

function onRadiusSlider(value: number[] | undefined) {
  if (value && Number.isFinite(value[0]))
    setAllCornersRadius(`${value[0]}px`)
}

const cornerShapeOptions = computed<Array<{ value: NonNullable<BaseBlockStyles['cornerShape']>, label: string, path: string }>>(() => [
  { value: 'round', label: t('style.round'), path: 'M1 13 V8 A7 7 0 0 1 8 1 H13' },
  { value: 'squircle', label: t('style.squircle'), path: 'M1 13 V7 C1 2.5 2.5 1 7 1 H13' },
  { value: 'bevel', label: t('style.bevel'), path: 'M1 13 V8 L8 1 H13' },
  { value: 'scoop', label: t('style.scoop'), path: 'M1 13 V8 A7 7 0 0 0 8 1 H13' },
  { value: 'notch', label: t('style.notch'), path: 'M1 13 V8 H8 V1 H13' },
  { value: 'square', label: t('style.square'), path: 'M1 13 V1 H13' },
])
const currentCornerShape = computed(() => styles.value.cornerShape ?? 'round')
const cornerShapeInert = computed(() => styles.value.cornerShape != null && !radiusModified.value)
const cornerShapeHint = computed(() => t('style.cornerShapeHint'))

function setCornerShape(value: unknown) {
  patch({ cornerShape: value === 'round' ? undefined : (value as BaseBlockStyles['cornerShape']) })
}

function cornerIconClass(corner: Corner) {
  return cn(
    'block w-3.5 h-3.5 border border-uf-muted',
    corner === 'tl' && 'rounded-tl-[5px]',
    corner === 'tr' && 'rounded-tr-[5px]',
    corner === 'bl' && 'rounded-bl-[5px]',
    corner === 'br' && 'rounded-br-[5px]',
  )
}
</script>

<template>
  <div class="grid gap-3">
    <StyleField :label="t('style.radius')" :modified="radiusModified" @reset="resetRadius">
      <div class="flex items-center gap-2">
        <Tooltip :text="t('style.allCornersShort')">
          <button
            type="button"
            :aria-label="t('style.allCorners')"
            :class="cn(
              'inline-flex items-center justify-center size-7 shrink-0 rounded-md border cursor-pointer transition-colors',
              radiusMode === 'all'
                ? 'border-uf-accent bg-uf-accent/10 text-uf-accent'
                : 'border-uf-border bg-uf-panel text-uf-muted hover:bg-uf-panel-muted',
            )"
            @click="radiusMode = 'all'"
          >
            <Square :size="14" :stroke-width="2" />
          </button>
        </Tooltip>
        <Tooltip :text="t('style.perCorner')">
          <button
            type="button"
            :aria-label="t('style.perCorner')"
            :class="cn(
              'inline-flex items-center justify-center size-7 shrink-0 rounded-md border border-dashed cursor-pointer transition-colors',
              radiusMode === 'individual'
                ? 'border-uf-accent bg-uf-accent/10 text-uf-accent'
                : 'border-uf-border bg-uf-panel text-uf-muted hover:bg-uf-panel-muted',
            )"
            @click="radiusMode = 'individual'"
          >
            <Square :size="14" :stroke-width="2" />
          </button>
        </Tooltip>
        <Slider
          v-if="!radiusIsVar"
          class="flex-1 min-w-0"
          :min="0"
          :max="120"
          :step="1"
          :model-value="radiusSliderValue"
          @update:model-value="onRadiusSlider"
        />
        <div :class="radiusIsVar ? 'flex-1 min-w-0' : 'w-24 shrink-0'">
          <BindableField type="size" :model-value="activeRadius" @update:model-value="setAllCornersRadius">
            <template #default="{ value, setValue, requestBind }">
              <SizeInput bindable :model-value="value" placeholder="0" @request-bind="requestBind" @update:model-value="setValue" />
            </template>
          </BindableField>
        </div>
      </div>
      <div v-if="radiusMode === 'individual'" class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
        <div v-for="corner in (['tl', 'tr', 'bl', 'br'] as const)" :key="corner" class="flex items-center gap-1.5 min-w-0">
          <span :class="cornerIconClass(corner)" aria-hidden="true" />
          <div class="flex-1 min-w-0">
            <BindableField type="size" :model-value="getCornerRadius(corner)" @update:model-value="(value: string) => setCornerRadius(corner, value)">
              <template #default="{ value, setValue, requestBind }">
                <SizeInput bindable :model-value="value" placeholder="0" @request-bind="requestBind" @update:model-value="setValue" />
              </template>
            </BindableField>
          </div>
        </div>
      </div>
      <p v-else-if="hasIndividualRadii" class="text-uf-muted text-[10px]">
        {{ t('style.perCornerOverwrite') }}
      </p>
    </StyleField>

    <StyleField :label="t('style.cornerShape')" field="cornerShape" :hint="cornerShapeHint">
      <Select :model-value="currentCornerShape" @update:model-value="setCornerShape">
        <SelectTrigger><SelectValue :placeholder="t('style.round')" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in cornerShapeOptions" :key="option.value" :value="option.value">
            <span class="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" class="shrink-0 text-uf-muted">
                <path :d="option.path" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ option.label }}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="cornerShapeInert" class="text-uf-muted text-[10px]">
        {{ t('style.cornerShapeInert') }}
      </p>
    </StyleField>
  </div>
</template>
