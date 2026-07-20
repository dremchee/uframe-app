<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { mergeStyles } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import GapControl from './GapControl.vue'
import GridTrackEditor from './GridTrackEditor.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()
const gridAutoFlowOptions = ['row', 'column', 'row dense', 'column dense']
const justifyItemsOptions = ['start', 'end', 'center', 'stretch']
const alignItemsOptions = ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']
const justifyContentOptions = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']
const alignContentOptions = ['start', 'end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly']

function update(patch: Partial<BaseBlockStyles>) {
  emit('update:modelValue', mergeStyles(styles.value, patch))
}
</script>

<template>
  <div class="grid gap-2">
    <GridTrackEditor :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <GapControl :model-value="styles" @update:model-value="emit('update:modelValue', $event)" />

    <StyleField :label="t('style.autoFlow')" field="gridAutoFlow">
      <Select
        :model-value="styles.gridAutoFlow"
        @update:model-value="value => update({ gridAutoFlow: value as BaseBlockStyles['gridAutoFlow'] })"
      >
        <SelectTrigger><SelectValue placeholder="row" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in gridAutoFlowOptions" :key="option" :value="option">
            {{ option }}
          </SelectItem>
        </SelectContent>
      </Select>
    </StyleField>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      <StyleField :label="t('style.justifyItems')" field="justifyItems">
        <Select
          :model-value="styles.justifyItems"
          @update:model-value="value => update({ justifyItems: value as BaseBlockStyles['justifyItems'] })"
        >
          <SelectTrigger><SelectValue placeholder="stretch" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in justifyItemsOptions" :key="option" :value="option">
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
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      <StyleField :label="t('style.justifyContent')" field="justifyContent">
        <Select
          :model-value="styles.justifyContent"
          @update:model-value="value => update({ justifyContent: value as BaseBlockStyles['justifyContent'] })"
        >
          <SelectTrigger><SelectValue placeholder="start" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in justifyContentOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.alignContent')" field="alignContent">
        <Select
          :model-value="styles.alignContent"
          @update:model-value="value => update({ alignContent: value as BaseBlockStyles['alignContent'] })"
        >
          <SelectTrigger><SelectValue placeholder="start" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in alignContentOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
  </div>
</template>
