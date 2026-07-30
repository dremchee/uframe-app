<script setup lang="ts">
import type { SegmentOption } from '@/components/ui'
import type { BaseBlockStyles } from '@/core'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, CaseLower, CaseSensitive, CaseUpper, Italic, Strikethrough, Type, Underline } from '@lucide/vue'
import { computed } from 'vue'
import { AdvancedSizeInput, ColorInput, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, SegmentControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SizeInput } from '@/components/ui'
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
} = useStylePanelModel(styles, value => emit('update:modelValue', value))

type FontStyle = NonNullable<BaseBlockStyles['fontStyle']>
type TextAlign = NonNullable<BaseBlockStyles['textAlign']>
type TextTransform = NonNullable<BaseBlockStyles['textTransform']>
type TextDecoration = NonNullable<BaseBlockStyles['textDecoration']>
type TextWrap = NonNullable<BaseBlockStyles['textWrap']>

const fontStyleOptions = computed<Array<SegmentOption<FontStyle>>>(() => [
  { value: 'normal', label: t('style.fontStyleNormal'), icon: Type },
  { value: 'italic', label: t('style.fontStyleItalic'), icon: Italic },
])
const textAlignOptions = computed<Array<SegmentOption<TextAlign>>>(() => [
  { value: 'left', label: t('style.alignLeft'), icon: AlignLeft },
  { value: 'center', label: t('style.alignCenter'), icon: AlignCenter },
  { value: 'right', label: t('style.alignRight'), icon: AlignRight },
  { value: 'justify', label: t('style.alignJustify'), icon: AlignJustify },
])
const textTransformOptions = computed<Array<SegmentOption<TextTransform>>>(() => [
  { value: 'none', label: t('style.transformNone'), icon: CaseSensitive },
  { value: 'uppercase', label: t('style.transformUppercase'), icon: CaseUpper },
  { value: 'lowercase', label: t('style.transformLowercase'), icon: CaseLower },
  { value: 'capitalize', label: t('style.transformCapitalize'), icon: CaseSensitive },
])
const textDecorationOptions = computed<Array<SegmentOption<TextDecoration>>>(() => [
  { value: 'none', label: t('style.decorationNone'), icon: CaseSensitive },
  { value: 'underline', label: t('style.decorationUnderline'), icon: Underline },
  { value: 'line-through', label: t('style.decorationLineThrough'), icon: Strikethrough },
])

const fontStyle = computed<FontStyle>(() => styles.value.fontStyle ?? inheritedPh('fontStyle', 'normal') as FontStyle)
const textAlign = computed<TextAlign>(() => styles.value.textAlign ?? inheritedPh('textAlign', 'left') as TextAlign)
const textTransform = computed<TextTransform>(() => styles.value.textTransform ?? inheritedPh('textTransform', 'none') as TextTransform)
const textDecoration = computed<TextDecoration>(() => styles.value.textDecoration ?? inheritedPh('textDecoration', 'none') as TextDecoration)
const textWrap = computed<TextWrap>(() => styles.value.textWrap ?? inheritedPh('textWrap', 'wrap') as TextWrap)
const textWrapOptions: TextWrap[] = ['wrap', 'nowrap', 'balance', 'pretty']

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
          <template #default="{ value, setValue, requestCreate, variables }">
            <AdvancedSizeInput
              bindable
              :model-value="value"
              :placeholder="inheritedPh('fontSize', '16px')"
              :variables="variables"
              @request-create-variable="requestCreate"
              @update:model-value="setValue"
            />
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
    </div>
    <div class="grid gap-x-1.5 gap-y-2.5 grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
      <StyleField :label="t('style.fontStyle')" field="fontStyle">
        <SegmentControl :model-value="fontStyle" :options="fontStyleOptions" :aria-label="t('style.fontStyle')" @update:model-value="value => update({ fontStyle: value })" />
      </StyleField>
      <StyleField :label="t('style.align')" field="textAlign">
        <SegmentControl :model-value="textAlign" :options="textAlignOptions" :aria-label="t('style.align')" @update:model-value="value => update({ textAlign: value })" />
      </StyleField>
      <StyleField :label="t('style.transform')" field="textTransform">
        <SegmentControl :model-value="textTransform" :options="textTransformOptions" :aria-label="t('style.transform')" @update:model-value="value => update({ textTransform: value })" />
      </StyleField>
      <StyleField :label="t('style.decoration')" field="textDecoration">
        <SegmentControl :model-value="textDecoration" :options="textDecorationOptions" :aria-label="t('style.decoration')" @update:model-value="value => update({ textDecoration: value })" />
      </StyleField>
      <StyleField :label="t('style.textWrap')" field="textWrap">
        <Select :model-value="textWrap" @update:model-value="value => update({ textWrap: value as TextWrap })">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in textWrapOptions" :key="option" :value="option">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </StyleField>
    </div>
    <StyleField :label="t('style.color')" field="color">
      <BindableField type="color" icon-trigger :model-value="styles.color ?? ''" @update:model-value="value => update({ color: value })">
        <template #default="{ value, setValue }">
          <ColorInput end-action popover-side="left" :model-value="value" :placeholder="inheritedPh('color', '#000000')" @update:model-value="nextValue => setValue(String(nextValue))" />
        </template>
      </BindableField>
    </StyleField>
  </StyleSection>
</template>
