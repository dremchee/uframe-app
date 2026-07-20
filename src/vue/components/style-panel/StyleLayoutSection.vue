<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { useStylePanelModel } from '@/vue/composables/style/useStylePanelModel'
import { useUframeI18n } from '@/vue/i18n'
import FlexItemControl from './FlexItemControl.vue'
import GapControl from './GapControl.vue'
import GridControl from './GridControl.vue'
import GridItemControl from './GridItemControl.vue'
import PositionControl from './PositionControl.vue'
import StyleField from './StyleField.vue'
import StyleSection from './StyleSection.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
  parentIsGrid?: boolean
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
  displayOptions,
  flexDirectionOptions,
  flexWrapOptions,
  justifyContentOptions,
  alignItemsOptions,
  overflowOptions,
} = useStylePanelModel(styles, value => emit('update:modelValue', value))
const isFlex = computed(() => styles.value.display === 'flex' || styles.value.display === 'inline-flex')
const isGrid = computed(() => styles.value.display === 'grid')
</script>

<template>
  <StyleSection id="layout" :title="t('style.layout')" open :modified="sectionModified(sectionKeys.Layout)">
    <StyleField :label="t('style.display')" field="display">
      <Select
        :model-value="styles.display"
        @update:model-value="value => update({ display: value as BaseBlockStyles['display'] })"
      >
        <SelectTrigger><SelectValue placeholder="block" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in displayOptions" :key="option" :value="option">
            {{ option }}
          </SelectItem>
        </SelectContent>
      </Select>
    </StyleField>

    <template v-if="isFlex">
      <StyleField :label="t('style.flexDirection')" field="flexDirection">
        <Select
          :model-value="styles.flexDirection"
          @update:model-value="value => update({ flexDirection: value as BaseBlockStyles['flexDirection'] })"
        >
          <SelectTrigger><SelectValue placeholder="row" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in flexDirectionOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.flexWrap')" field="flexWrap">
        <Select
          :model-value="styles.flexWrap"
          @update:model-value="value => update({ flexWrap: value as BaseBlockStyles['flexWrap'] })"
        >
          <SelectTrigger><SelectValue placeholder="nowrap" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in flexWrapOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.justifyContent')" field="justifyContent">
        <Select
          :model-value="styles.justifyContent"
          @update:model-value="value => update({ justifyContent: value as BaseBlockStyles['justifyContent'] })"
        >
          <SelectTrigger><SelectValue placeholder="flex-start" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in justifyContentOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.alignItems')" field="alignItems">
        <Select
          :model-value="styles.alignItems"
          @update:model-value="value => update({ alignItems: value as BaseBlockStyles['alignItems'] })"
        >
          <SelectTrigger><SelectValue placeholder="stretch" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in alignItemsOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <GapControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />
    </template>

    <GridControl v-if="isGrid" :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <template v-if="parentIsGrid">
      <div class="text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
        {{ t('style.gridPlacement') }}
      </div>
      <GridItemControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />
    </template>

    <template v-if="parentIsFlex">
      <div class="text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
        {{ t('style.flexChild') }}
      </div>
      <FlexItemControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />
    </template>

    <PositionControl
      :position="styles.position"
      :top="styles.top"
      :right="styles.right"
      :bottom="styles.bottom"
      :left="styles.left"
      @update="update"
    />
    <div class="grid gap-x-1.5 gap-y-2.5 grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
      <StyleField :label="t('style.zIndex')" field="zIndex">
        <NumberField
          :model-value="styles.zIndex ?? undefined"
          @update:model-value="value => update({ zIndex: Number.isFinite(value) ? value : undefined })"
        >
          <NumberFieldContent>
            <NumberFieldInput />
            <NumberFieldStepper>
              <NumberFieldIncrement />
              <NumberFieldDecrement />
            </NumberFieldStepper>
          </NumberFieldContent>
        </NumberField>
      </StyleField>
      <StyleField :label="t('style.overflow')" field="overflow">
        <Select
          :model-value="styles.overflow"
          @update:model-value="value => update({ overflow: value as BaseBlockStyles['overflow'] })"
        >
          <SelectTrigger><SelectValue placeholder="visible" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in overflowOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
  </StyleSection>
</template>
