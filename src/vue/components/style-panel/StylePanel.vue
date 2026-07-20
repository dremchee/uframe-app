<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { useStylePanelModel } from '@/vue/composables/style/useStylePanelModel'
import { useUframeI18n } from '@/vue/i18n'
import BackgroundInput from './BackgroundInput.vue'
import BorderControl from './BorderControl.vue'
import SpacingControl from './SpacingControl.vue'
import StyleEffectsSection from './StyleEffectsSection.vue'
import StyleLayoutSection from './StyleLayoutSection.vue'
import StyleSection from './StyleSection.vue'
import StyleSizeSection from './StyleSizeSection.vue'
import StyleTypographySection from './StyleTypographySection.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
  /** True when the selected block's parent is a grid — reveals item placement. */
  parentIsGrid?: boolean
  /** True when the selected block's parent is flex — reveals flex-item controls. */
  parentIsFlex?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()

const {
  sectionKeys,
  sectionModified,
  update,
  updateSpacing,
} = useStylePanelModel(styles, value => emit('update:modelValue', value))
</script>

<template>
  <div class="grid">
    <StyleLayoutSection
      :model-value="styles"
      :parent-is-grid="parentIsGrid"
      :parent-is-flex="parentIsFlex"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <StyleSizeSection :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <StyleSection id="spacing" :title="t('style.spacing')" open :modified="sectionModified(sectionKeys.Spacing)">
      <SpacingControl :model-value="styles" @update:model-value="updateSpacing" />
    </StyleSection>

    <StyleTypographySection :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <StyleSection id="background" :title="t('style.background')" :modified="sectionModified(sectionKeys.Background)">
      <BackgroundInput :model-value="styles" @update:model-value="update" />
    </StyleSection>

    <StyleSection id="border" :title="t('style.borders')" :modified="sectionModified(sectionKeys.Borders)">
      <BorderControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />
    </StyleSection>

    <StyleEffectsSection :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />
  </div>
</template>
