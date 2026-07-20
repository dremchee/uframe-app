<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { Input, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, Slider } from '@/components/ui'
import { useStylePanelModel } from '@/vue/composables/style/useStylePanelModel'
import { useUframeI18n } from '@/vue/i18n'
import FilterListControl from './FilterListControl.vue'
import ShadowListControl from './ShadowListControl.vue'
import StyleField from './StyleField.vue'
import StyleSection from './StyleSection.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
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
  inheritedPh,
} = useStylePanelModel(styles, value => emit('update:modelValue', value))
</script>

<template>
  <StyleSection id="effects" :title="t('style.effects')" :modified="sectionModified(sectionKeys.Effects)">
    <StyleField :label="t('style.opacity')" field="opacity">
      <div class="flex items-center gap-2">
        <Slider
          class="flex-1 min-w-0"
          :min="0"
          :max="1"
          :step="0.01"
          :model-value="[styles.opacity ?? 1]"
          @update:model-value="value => update({ opacity: value && Number.isFinite(value[0]) ? value[0] : undefined })"
        />
        <div class="w-24 shrink-0">
          <NumberField
            :model-value="styles.opacity ?? undefined"
            :min="0"
            :max="1"
            :step="0.05"
            @update:model-value="value => update({ opacity: Number.isFinite(value) ? value : undefined })"
          >
            <NumberFieldContent>
              <NumberFieldInput placeholder="1" />
              <NumberFieldStepper>
                <NumberFieldIncrement />
                <NumberFieldDecrement />
              </NumberFieldStepper>
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
    </StyleField>
    <StyleField :label="t('style.boxShadows')" field="boxShadow">
      <ShadowListControl
        :model-value="styles.boxShadow"
        @update:model-value="value => update({ boxShadow: value })"
      />
    </StyleField>
    <StyleField :label="t('style.filters')" field="filter">
      <FilterListControl
        :title="t('style.filter')"
        :model-value="styles.filter"
        @update:model-value="value => update({ filter: value })"
      />
    </StyleField>
    <StyleField :label="t('style.backdropFilters')" field="backdropFilter">
      <FilterListControl
        :title="t('style.backdropFilter')"
        :model-value="styles.backdropFilter"
        @update:model-value="value => update({ backdropFilter: value })"
      />
    </StyleField>
    <StyleField :label="t('style.transform')" field="transform">
      <Input
        :model-value="styles.transform ?? ''"
        placeholder="rotate(2deg)"
        @update:model-value="value => update({ transform: String(value) })"
      />
    </StyleField>
    <StyleField :label="t('style.cursor')" field="cursor">
      <Input
        :model-value="styles.cursor ?? ''"
        :placeholder="inheritedPh('cursor', 'pointer')"
        @update:model-value="value => update({ cursor: String(value) })"
      />
    </StyleField>
  </StyleSection>
</template>
