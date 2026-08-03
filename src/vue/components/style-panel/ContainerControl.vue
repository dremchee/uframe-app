<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed, shallowRef, watch } from 'vue'
import { Input, Switch } from '@/components/ui'
import { containerNameSchema, isAutomaticContainerName, mergeStyles, nextContainerName } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const { t } = useUframeI18n()
const { editor } = useEditorContext()
const enabled = computed(() => props.modelValue.containerType === 'inline-size')
const draftName = shallowRef('')
const nameInvalid = computed(() =>
  enabled.value
  && !!draftName.value
  && !containerNameSchema.safeParse(draftName.value).success,
)
const automaticName = computed(() =>
  isAutomaticContainerName(props.modelValue.containerName)
    ? props.modelValue.containerName!
    : nextContainerName(editor.effectiveDocument.value),
)

watch(
  () => props.modelValue.containerName,
  name => draftName.value = isAutomaticContainerName(name) ? '' : (name ?? ''),
  { immediate: true },
)

function setEnabled(next: boolean) {
  const containerName = props.modelValue.containerName || nextContainerName(editor.effectiveDocument.value)
  draftName.value = next && !isAutomaticContainerName(containerName) ? containerName : ''
  emit('update:modelValue', mergeStyles(props.modelValue, next
    ? {
        containerType: 'inline-size',
        containerName,
      }
    : { containerType: undefined, containerName: undefined }))
}

function setName(value: string | number) {
  const name = String(value)
  draftName.value = name
  if (!name) {
    const containerName = isAutomaticContainerName(props.modelValue.containerName)
      ? props.modelValue.containerName
      : nextContainerName(editor.effectiveDocument.value)
    emit('update:modelValue', mergeStyles(props.modelValue, { containerName }))
    return
  }
  if (!containerNameSchema.safeParse(name).success)
    return
  emit('update:modelValue', mergeStyles(props.modelValue, { containerName: name }))
}

function restoreValidName() {
  if (nameInvalid.value) {
    draftName.value = isAutomaticContainerName(props.modelValue.containerName)
      ? ''
      : (props.modelValue.containerName ?? '')
  }
}
</script>

<template>
  <div class="grid gap-2 rounded-md border border-uf-border p-2.5">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <div class="text-xs font-medium text-uf-text">
          {{ t('style.useAsContainer') }}
        </div>
        <div class="mt-0.5 text-[11px] leading-snug text-uf-muted">
          {{ t('style.containerHint') }}
        </div>
      </div>
      <Switch
        :model-value="enabled"
        :aria-label="t('style.useAsContainer')"
        @update:model-value="setEnabled"
      />
    </div>

    <div v-if="enabled" class="grid gap-1">
      <label
        for="uf-container-name"
        class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted"
      >
        {{ t('style.containerName') }}
      </label>
      <Input
        id="uf-container-name"
        :model-value="draftName"
        :aria-invalid="nameInvalid"
        :class="nameInvalid ? 'border-uf-danger focus-visible:border-uf-danger focus-visible:ring-uf-danger' : undefined"
        :placeholder="automaticName"
        @update:model-value="setName"
        @blur="restoreValidName"
      />
      <p
        class="m-0 text-[10px] leading-snug"
        :class="nameInvalid ? 'text-uf-danger' : 'text-uf-muted'"
      >
        {{ t(nameInvalid ? 'style.containerNameInvalid' : 'style.containerNameHint') }}
      </p>
    </div>
  </div>
</template>
