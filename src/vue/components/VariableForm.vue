<script setup lang="ts">
import type { CssVarType } from '@/core'
import { computed } from 'vue'
import {
  Button,
  ColorInput,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SizeInput,
} from '@/components/ui'
import { parseShadowString, serializeShadows } from '@/core'
import FontFamilySelect from '@/vue/components/style-panel/FontFamilySelect.vue'
import ShadowListControl from '@/vue/components/style-panel/ShadowListControl.vue'
import { useUframeI18n } from '@/vue/i18n'

export interface VariableDraft {
  name: string
  val: string
  type: CssVarType
}

const props = defineProps<{
  modelValue: VariableDraft
  submitLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: VariableDraft]
  'submit': []
  'cancel': []
}>()

const { t } = useUframeI18n()

const TYPE_OPTIONS = computed<Array<{ value: CssVarType, label: string }>>(() => [
  { value: 'color', label: t('variables.typeColor') },
  { value: 'size', label: t('variables.typeSize') },
  { value: 'number', label: t('variables.typeNumber') },
  { value: 'font', label: t('variables.typeFont') },
  { value: 'shadow', label: t('variables.typeShadow') },
  { value: 'other', label: t('variables.typeOther') },
])

function patch(part: Partial<VariableDraft>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="emit('submit')">
    <Input
      :model-value="modelValue.name"
      spellcheck="false"
      :placeholder="t('variables.labelPlaceholder')"
      :aria-label="t('variables.labelAria')"
      autofocus
      @update:model-value="(val) => patch({ name: String(val) })"
    />

    <Select :model-value="modelValue.type" @update:model-value="(val) => patch({ type: val as CssVarType })">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <ColorInput
      v-if="modelValue.type === 'color'"
      :model-value="modelValue.val"
      placeholder="#000000"
      @update:model-value="(val) => patch({ val })"
    />
    <SizeInput
      v-else-if="modelValue.type === 'size'"
      :model-value="modelValue.val"
      placeholder="0"
      @update:model-value="(val) => patch({ val })"
    />
    <FontFamilySelect
      v-else-if="modelValue.type === 'font'"
      :model-value="modelValue.val"
      :placeholder="t('fontControl.placeholder')"
      @update:model-value="(val) => patch({ val })"
    />
    <ShadowListControl
      v-else-if="modelValue.type === 'shadow'"
      :model-value="parseShadowString(modelValue.val)"
      @update:model-value="(list) => patch({ val: serializeShadows(list) })"
    />
    <Input
      v-else
      :model-value="modelValue.val"
      :placeholder="t('variables.valuePlaceholder')"
      @update:model-value="(val) => patch({ val: String(val) })"
    />

    <div class="flex justify-end gap-2">
      <Button type="button" variant="ghost" size="sm" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" size="sm">
        {{ submitLabel ?? t('common.save') }}
      </Button>
    </div>
  </form>
</template>
