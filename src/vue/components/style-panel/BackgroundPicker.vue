<script setup lang="ts">
import type { SegmentOption } from '@/components/ui'
import type { BackgroundStyles, BackgroundType, GradientValue } from '@/core'
import { Ban, Circle, Droplet, Image, MoveDiagonal } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import {
  ColorInput,
  Input,
  SegmentControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import {
  defaultLinearGradient,
  defaultRadialGradient,
  detectBackgroundType,
  parseGradient,
  parseImageUrl,
  serializeGradient,
  serializeImageUrl,
} from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import BackgroundGradientEditor from './BackgroundGradientEditor.vue'
import BindableField from './BindableField.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BackgroundStyles
}>()

const emit = defineEmits<{
  // A patch over the background style keys: cleared keys come back as
  // `undefined` so the parent's mergeStyles drops them.
  'update:modelValue': [patch: Partial<BackgroundStyles>]
}>()
const { t } = useUframeI18n()

// Local selection so an empty colour / image-URL field (which reads as "none"
// from the stored values) doesn't snap the picker back to None mid-edit. We
// re-adopt the values' inherent type whenever it's unambiguous.
const selectedType = ref<BackgroundType>(detectBackgroundType(props.modelValue))
watch(() => detectBackgroundType(props.modelValue), (detected) => {
  if (detected !== 'none')
    selectedType.value = detected
})

const typeOptions = computed<Array<SegmentOption<BackgroundType>>>(() => [
  { value: 'none', label: t('style.backgroundNone'), icon: Ban },
  { value: 'color', label: t('style.backgroundColor'), icon: Droplet },
  { value: 'image', label: t('style.backgroundImage'), icon: Image },
  { value: 'linear', label: t('style.linearGradient'), icon: MoveDiagonal },
  { value: 'radial', label: t('style.radialGradient'), icon: Circle },
])

const backgroundRepeatOptions = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y']
const backgroundSizeOptions = ['auto', 'cover', 'contain']
const backgroundPositionOptions = ['center', 'top', 'bottom', 'left', 'right']

const ALL_KEYS: Array<keyof BackgroundStyles> = [
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
]

/** Build a patch that clears every background key, then applies overrides. */
function clearedPatch(overrides: Partial<BackgroundStyles> = {}): Partial<BackgroundStyles> {
  const patch: Partial<BackgroundStyles> = {}
  for (const key of ALL_KEYS)
    patch[key] = undefined
  return Object.assign(patch, overrides)
}

// ── Type switching ───────────────────────────────────────────────────────────
function setType(type: BackgroundType) {
  selectedType.value = type
  if (type === 'none') {
    emit('update:modelValue', clearedPatch())
    return
  }
  if (type === 'color') {
    emit('update:modelValue', clearedPatch({ backgroundColor: props.modelValue.backgroundColor || undefined }))
    return
  }
  if (type === 'image') {
    // Keep an existing image URL; drop a gradient. Preserve size/position/repeat.
    const keepUrl = detectBackgroundType(props.modelValue) === 'image' ? props.modelValue.backgroundImage : undefined
    emit('update:modelValue', { backgroundColor: undefined, backgroundImage: keepUrl || undefined })
    return
  }
  // linear | radial — reuse the existing gradient's stops (the user's colours)
  // across the switch; only the type-specific geometry (angle / shape+position)
  // falls back to a default. Seed a fresh default when there's no gradient yet.
  const current = parseGradient(props.modelValue.backgroundImage)
  const base = type === 'linear' ? defaultLinearGradient() : defaultRadialGradient()
  const next: GradientValue = current
    ? (current.type === type ? current : { ...base, stops: current.stops })
    : base
  emit('update:modelValue', clearedPatch({ backgroundImage: serializeGradient(next) }))
}

// ── Colour ─────────────────────────────────────────────────────────────────
function setColor(value: string) {
  emit('update:modelValue', { backgroundColor: value || undefined })
}

// ── Image ────────────────────────────────────────────────────────────────────
const imageUrl = computed(() => parseImageUrl(props.modelValue.backgroundImage))
function setImageUrl(value: string) {
  emit('update:modelValue', { backgroundImage: serializeImageUrl(String(value)) || undefined })
}

// ── Gradient ──────────────────────────────────────────────────────────────────
const gradient = computed<GradientValue>(() => {
  const parsed = parseGradient(props.modelValue.backgroundImage)
  if (parsed && parsed.type === selectedType.value)
    return parsed
  return selectedType.value === 'radial' ? defaultRadialGradient() : defaultLinearGradient()
})

function updateGradient(next: GradientValue) {
  emit('update:modelValue', clearedPatch({ backgroundImage: serializeGradient(next) }))
}
</script>

<template>
  <div class="flex flex-col gap-3 min-w-0">
    <StyleField :label="t('style.type')">
      <SegmentControl
        :model-value="selectedType"
        :options="typeOptions"
        :aria-label="t('style.backgroundType')"
        @update:model-value="setType"
      />
    </StyleField>

    <!-- None -->
    <p v-if="selectedType === 'none'" class="text-uf-muted text-[11px] leading-snug">
      {{ t('style.noBackground') }}
    </p>

    <!-- Solid color (bindable to a CSS variable) -->
    <StyleField v-else-if="selectedType === 'color'" :label="t('style.color')">
      <BindableField
        type="color"
        icon-trigger
        :model-value="modelValue.backgroundColor ?? ''"
        @update:model-value="setColor"
      >
        <template #default="{ value, setValue }">
          <ColorInput end-action :model-value="value" placeholder="transparent" @update:model-value="v => setValue(String(v))" />
        </template>
      </BindableField>
    </StyleField>

    <!-- Image -->
    <template v-else-if="selectedType === 'image'">
      <StyleField :label="t('style.imageUrl')">
        <Input
          :model-value="imageUrl"
          placeholder="https://…/image.png"
          @update:model-value="value => setImageUrl(String(value))"
        />
      </StyleField>
      <div
        v-if="imageUrl"
        class="h-14 rounded-md border border-uf-border bg-uf-panel-muted bg-center bg-no-repeat bg-cover"
        :style="{ backgroundImage: serializeImageUrl(imageUrl) }"
      />
      <div class="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
        <StyleField :label="t('style.imageSize')">
          <Select
            :model-value="modelValue.backgroundSize"
            @update:model-value="value => emit('update:modelValue', { backgroundSize: value as BackgroundStyles['backgroundSize'] })"
          >
            <SelectTrigger><SelectValue placeholder="auto" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in backgroundSizeOptions" :key="option" :value="option">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </StyleField>
        <StyleField :label="t('style.imagePosition')">
          <Select
            :model-value="modelValue.backgroundPosition"
            @update:model-value="value => emit('update:modelValue', { backgroundPosition: value as BackgroundStyles['backgroundPosition'] })"
          >
            <SelectTrigger><SelectValue placeholder="center" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in backgroundPositionOptions" :key="option" :value="option">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </StyleField>
        <StyleField :label="t('style.imageRepeat')">
          <Select
            :model-value="modelValue.backgroundRepeat"
            @update:model-value="value => emit('update:modelValue', { backgroundRepeat: value as BackgroundStyles['backgroundRepeat'] })"
          >
            <SelectTrigger><SelectValue placeholder="no-repeat" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in backgroundRepeatOptions" :key="option" :value="option">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </StyleField>
      </div>
    </template>

    <BackgroundGradientEditor v-else :model-value="gradient" @update:model-value="updateGradient" />
  </div>
</template>
