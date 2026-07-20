<script setup lang="ts">
import type { SegmentOption } from '@/components/ui'
import type { BaseBlockStyles, CssLength } from '@/core'
import { EyeOff, X } from '@lucide/vue'
import { computed } from 'vue'
import {
  ColorInput,
  SegmentControl,
  SizeInput,
} from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import BorderRadiusControl from './BorderRadiusControl.vue'
import BorderSidePicker from './BorderSidePicker.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()

type Side = 'top' | 'right' | 'bottom' | 'left'
type WidthKey = `border${'Top' | 'Right' | 'Bottom' | 'Left'}Width`

const widthKeys: Record<Side, WidthKey> = {
  top: 'borderTopWidth',
  right: 'borderRightWidth',
  bottom: 'borderBottomWidth',
  left: 'borderLeftWidth',
}

const modifiedBorderSides = computed<Side[]>(() =>
  (Object.entries(widthKeys) as Array<[Side, WidthKey]>)
    .filter(([, key]) => styles.value[key] != null)
    .map(([side]) => side),
)

// Local UI state — not persisted into the document.
const selectedSide = defineModel<Side | 'all'>('side', { default: 'all' })

function patch(p: Partial<BaseBlockStyles>) {
  const next: BaseBlockStyles = { ...styles.value }
  for (const [k, v] of Object.entries(p)) {
    if (v === '' || v === undefined || v === null)
      delete (next as Record<string, unknown>)[k]
    else
      (next as Record<string, unknown>)[k] = v
  }
  emit('update:modelValue', next)
}

// ── Width ───────────────────────────────────────────────────────────────────
const activeWidth = computed<CssLength | ''>(() => {
  if (selectedSide.value === 'all')
    return styles.value.borderTopWidth ?? ''
  return styles.value[widthKeys[selectedSide.value]] ?? ''
})
function setWidth(value: string) {
  const v = value || undefined
  if (selectedSide.value === 'all') {
    patch({
      borderTopWidth: v,
      borderRightWidth: v,
      borderBottomWidth: v,
      borderLeftWidth: v,
    })
    return
  }
  patch({ [widthKeys[selectedSide.value]]: v } as Partial<BaseBlockStyles>)
}

// ── Style ───────────────────────────────────────────────────────────────────
// The full CSS <line-style> set, split by frequency: the everyday four are
// segments of the SegmentControl track and the exotic rest lives in its
// overflow menu. `none` is the sentinel for "no border style" (stored as
// undefined; it's the CSS initial value). Options without an icon render a
// live preview box via the #option slot — the browser draws the real line
// style, so dashed / double / groove / … need no bespoke icons.
type BorderStyleOption = SegmentOption<NonNullable<BaseBlockStyles['borderStyle']>>
const commonStyleOptions = computed<BorderStyleOption[]>(() => [
  { value: 'none', icon: X, label: t('style.borderNone') },
  { value: 'solid', label: t('style.borderSolid') },
  { value: 'dashed', label: t('style.borderDashed') },
  { value: 'dotted', label: t('style.borderDotted') },
])
const moreStyleOptions = computed<BorderStyleOption[]>(() => [
  { value: 'hidden', icon: EyeOff, label: t('style.borderHidden') },
  { value: 'double', label: t('style.borderDouble') },
  { value: 'groove', label: t('style.borderGroove') },
  { value: 'ridge', label: t('style.borderRidge') },
  { value: 'inset', label: t('style.borderInset') },
  { value: 'outset', label: t('style.borderOutset') },
])
const currentStyle = computed(() => styles.value.borderStyle ?? 'none')
function setStyle(v: unknown) {
  patch({ borderStyle: v === 'none' ? undefined : (v as BaseBlockStyles['borderStyle']) })
}

// ── Color ───────────────────────────────────────────────────────────────────
function setColor(v: string) {
  patch({ borderColor: v || undefined })
}

// ── Group reset (composite fields clear all their sides / corners) ───────────
const widthModified = computed(() =>
  (Object.values(widthKeys) as WidthKey[]).some(k => styles.value[k] != null),
)
function resetWidth() {
  patch({
    borderTopWidth: undefined,
    borderRightWidth: undefined,
    borderBottomWidth: undefined,
    borderLeftWidth: undefined,
  })
}
</script>

<template>
  <div class="grid gap-3">
    <BorderRadiusControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <BorderSidePicker v-model="selectedSide" :modified-sides="modifiedBorderSides" />

    <!-- Per-side controls share the StyleField label-above pattern with the
         rest of the style panel. -->
    <div class="grid gap-2">
      <StyleField :label="t('style.style')" field="borderStyle">
        <SegmentControl
          :model-value="currentStyle"
          :options="commonStyleOptions"
          :overflow="moreStyleOptions"
          :aria-label="t('style.borderStyle')"
          :overflow-label="t('style.moreBorderStyles')"
          @update:model-value="setStyle"
        >
          <!-- Iconless options draw a square live preview — the browser
               renders the actual line style. -->
          <template #option="{ option }">
            <component :is="option.icon" v-if="option.icon" :size="14" :stroke-width="2" />
            <span
              v-else
              class="block size-3.5 rounded-[2px]"
              :style="{ border: `2px ${option.value} currentColor` }"
              aria-hidden="true"
            />
          </template>
          <template #overflow-item="{ option }">
            <component :is="option.icon" v-if="option.icon" :size="14" :stroke-width="2" class="shrink-0" aria-hidden="true" />
            <span
              v-else
              class="block size-3.5 shrink-0 rounded-[2px]"
              :style="{ border: `2px ${option.value} currentColor` }"
              aria-hidden="true"
            />
            {{ option.label }}
          </template>
        </SegmentControl>
      </StyleField>

      <StyleField :label="t('style.width')" :modified="widthModified" @reset="resetWidth">
        <BindableField type="size" :model-value="activeWidth" @update:model-value="setWidth">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="0" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>

      <StyleField :label="t('style.color')" field="borderColor">
        <BindableField type="color" icon-trigger :model-value="styles.borderColor ?? ''" @update:model-value="setColor">
          <template #default="{ value, setValue }">
            <ColorInput end-action :model-value="value" placeholder="#000000" @update:model-value="v => setValue(String(v))" />
          </template>
        </BindableField>
      </StyleField>
    </div>
  </div>
</template>
