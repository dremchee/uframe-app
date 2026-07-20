<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { ColorInput, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SizeInput } from '@/components/ui'
import { useStylePanelModel } from '@/vue/composables/style/useStylePanelModel'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import FontFamilySelect from './FontFamilySelect.vue'
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
  textAlignOptions,
  textTransformOptions,
  textDecorationOptions,
  fontStyleOptions,
} = useStylePanelModel(styles, value => emit('update:modelValue', value))

function updateFontWeight(value: number | undefined) {
  if (!Number.isFinite(value)) {
    update({ fontWeight: undefined })
    return
  }
  update({ fontWeight: value })
}
</script>

<template>
  <StyleSection id="typography" :title="t('style.typography')" :modified="sectionModified(sectionKeys.Typography)">
    <StyleField :label="t('style.fontFamily')" field="fontFamily">
      <BindableField type="font" :model-value="styles.fontFamily ?? ''" @update:model-value="value => update({ fontFamily: value })">
        <template #default="{ value, setValue, requestBind }">
          <FontFamilySelect bindable :model-value="value" :placeholder="inheritedPh('fontFamily', 'Inter, sans-serif')" @update:model-value="setValue" @bind="requestBind" />
        </template>
      </BindableField>
    </StyleField>
    <div class="grid gap-x-1.5 gap-y-2.5 grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
      <StyleField :label="t('style.fontSize')" field="fontSize">
        <BindableField type="size" :model-value="styles.fontSize ?? ''" @update:model-value="value => update({ fontSize: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" :placeholder="inheritedPh('fontSize', '16')" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.fontWeight')" field="fontWeight">
        <NumberField
          :model-value="styles.fontWeight ?? undefined"
          :min="1"
          :max="1000"
          :step="1"
          @update:model-value="updateFontWeight"
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
      <StyleField :label="t('style.lineHeight')" field="lineHeight">
        <BindableField type="size" :model-value="styles.lineHeight ?? ''" @update:model-value="value => update({ lineHeight: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable default-unit="—" :model-value="value" :placeholder="inheritedPh('lineHeight', '1.5')" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.letterSpacing')" field="letterSpacing">
        <BindableField type="size" :model-value="styles.letterSpacing ?? ''" @update:model-value="value => update({ letterSpacing: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" :placeholder="inheritedPh('letterSpacing', '0')" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.fontStyle')" field="fontStyle">
        <Select
          :model-value="styles.fontStyle"
          @update:model-value="value => update({ fontStyle: value as BaseBlockStyles['fontStyle'] })"
        >
          <SelectTrigger><SelectValue :placeholder="inheritedPh('fontStyle', 'normal')" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in fontStyleOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.align')" field="textAlign">
        <Select
          :model-value="styles.textAlign"
          @update:model-value="value => update({ textAlign: value as BaseBlockStyles['textAlign'] })"
        >
          <SelectTrigger><SelectValue :placeholder="inheritedPh('textAlign', 'left')" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in textAlignOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.transform')" field="textTransform">
        <Select
          :model-value="styles.textTransform"
          @update:model-value="value => update({ textTransform: value as BaseBlockStyles['textTransform'] })"
        >
          <SelectTrigger><SelectValue :placeholder="inheritedPh('textTransform', 'none')" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in textTransformOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
      <StyleField :label="t('style.decoration')" field="textDecoration">
        <Select
          :model-value="styles.textDecoration"
          @update:model-value="value => update({ textDecoration: value as BaseBlockStyles['textDecoration'] })"
        >
          <SelectTrigger><SelectValue :placeholder="inheritedPh('textDecoration', 'none')" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in textDecorationOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
    <StyleField :label="t('style.color')" field="color">
      <BindableField type="color" icon-trigger :model-value="styles.color ?? ''" @update:model-value="value => update({ color: value })">
        <template #default="{ value, setValue }">
          <ColorInput end-action :model-value="value" :placeholder="inheritedPh('color', '#000000')" @update:model-value="nextValue => setValue(String(nextValue))" />
        </template>
      </BindableField>
    </StyleField>
  </StyleSection>
</template>
