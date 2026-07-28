<script setup lang="ts">
import type { HtmlAttributeNameError } from '@/core'
import { computed, shallowRef } from 'vue'
import { Button, Input, Label } from '@/components/ui'
import {
  htmlAttributeNameError,
  normalizeHtmlAttributeName,
} from '@/core'
import { useUframeI18n } from '@/vue/i18n'

export interface AttributeDraft {
  name: string
  value: string
}

const props = withDefaults(defineProps<{
  initialName?: string
  initialValue?: string
  existingNames?: string[]
  submitLabel?: string
}>(), {
  initialName: '',
  initialValue: '',
  existingNames: () => [],
})

const emit = defineEmits<{
  submit: [draft: AttributeDraft]
  cancel: []
}>()

const { t } = useUframeI18n()
const name = shallowRef(props.initialName)
const value = shallowRef(props.initialValue)
const touched = shallowRef(false)

const normalizedName = computed(() => normalizeHtmlAttributeName(name.value))
const nameError = computed<HtmlAttributeNameError | 'duplicate' | null>(() => {
  const error = htmlAttributeNameError(normalizedName.value)
  if (error)
    return error
  return props.existingNames.some(existing => (
    normalizeHtmlAttributeName(existing) === normalizedName.value
  ))
    ? 'duplicate'
    : null
})

const visibleError = computed(() => touched.value ? nameError.value : null)

function updateName(next: string | number) {
  name.value = String(next)
  touched.value = true
}

function updateValue(next: string | number) {
  value.value = String(next)
}

function submit() {
  touched.value = true
  if (nameError.value)
    return
  emit('submit', {
    name: normalizedName.value,
    value: value.value,
  })
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <Label>
      <span>{{ t('attributes.name') }}</span>
      <Input
        :model-value="name"
        spellcheck="false"
        autofocus
        :placeholder="t('attributes.namePlaceholder')"
        :aria-label="t('attributes.name')"
        :class="visibleError ? 'border-uf-danger' : undefined"
        @update:model-value="updateName"
      />
      <span v-if="visibleError" class="text-[10px] leading-tight text-uf-danger">
        {{ t(`attributes.errors.${visibleError}`) }}
      </span>
    </Label>

    <Label>
      <span>{{ t('attributes.value') }}</span>
      <Input
        :model-value="value"
        :placeholder="t('attributes.valuePlaceholder')"
        :aria-label="t('attributes.value')"
        @update:model-value="updateValue"
      />
    </Label>

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
