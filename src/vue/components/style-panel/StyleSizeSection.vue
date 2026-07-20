<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { SizeInput } from '@/components/ui'
import { useStylePanelModel } from '@/vue/composables/style/useStylePanelModel'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
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
} = useStylePanelModel(styles, value => emit('update:modelValue', value))
</script>

<template>
  <StyleSection id="size" :title="t('style.size')" :modified="sectionModified(sectionKeys.Size)">
    <div class="grid gap-x-1.5 gap-y-2.5 grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
      <StyleField :label="t('style.width')" field="width">
        <BindableField type="size" :model-value="styles.width ?? ''" @update:model-value="value => update({ width: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="auto" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.height')" field="height">
        <BindableField type="size" :model-value="styles.height ?? ''" @update:model-value="value => update({ height: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="auto" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.minWidth')" field="minWidth">
        <BindableField type="size" :model-value="styles.minWidth ?? ''" @update:model-value="value => update({ minWidth: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="0" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.minHeight')" field="minHeight">
        <BindableField type="size" :model-value="styles.minHeight ?? ''" @update:model-value="value => update({ minHeight: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="0" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.maxWidth')" field="maxWidth">
        <BindableField type="size" :model-value="styles.maxWidth ?? ''" @update:model-value="value => update({ maxWidth: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="none" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
      <StyleField :label="t('style.maxHeight')" field="maxHeight">
        <BindableField type="size" :model-value="styles.maxHeight ?? ''" @update:model-value="value => update({ maxHeight: value })">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :model-value="value" placeholder="none" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </StyleField>
    </div>
  </StyleSection>
</template>
