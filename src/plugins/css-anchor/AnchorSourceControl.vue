<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { Input, Switch } from '@/components/ui'
import StyleField from '@/vue/components/style-panel/StyleField.vue'
import { useUframeI18n } from '@/vue/i18n'
import { normalizeAnchorName } from './anchor-css'

const props = defineProps<{
  modelValue: BaseBlockStyles
  suggestedName: string
}>()

const emit = defineEmits<{
  update: [patch: Partial<BaseBlockStyles>]
}>()

const { t } = useUframeI18n()
const enabled = computed(() => !!props.modelValue.anchorName)

function setEnabled(value: boolean) {
  emit('update', value
    ? { anchorName: props.modelValue.anchorName || props.suggestedName }
    : { anchorName: undefined, anchorScope: undefined })
}

function commitName(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update', { anchorName: normalizeAnchorName(value, props.suggestedName.replace(/^--/, '')) })
}
</script>

<template>
  <div class="grid gap-2.5">
    <div class="text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
      {{ t('cssAnchor.source') }}
    </div>
    <Switch :model-value="enabled" @update:model-value="setEnabled">
      {{ t('cssAnchor.useAsAnchor') }}
    </Switch>
    <StyleField
      v-if="enabled"
      :label="t('cssAnchor.anchorName')"
      field="anchorName"
      :hint="t('cssAnchor.anchorNameHint')"
    >
      <Input :model-value="modelValue.anchorName" @change="commitName" />
    </StyleField>
  </div>
</template>
