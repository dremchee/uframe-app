<script setup lang="ts">
import type { PlaceholderBlockProps } from '@/core'
import { placeholderLabel, placeholderRatio, resolvePlaceholderKind } from '@/blocks/placeholder/render'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { PLACEHOLDER_KINDS, PLACEHOLDER_RATIOS } from '@/core'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<PlaceholderBlockProps>({ required: true })
const { t } = useUframeI18n()

function kindLabel(kind: string): string {
  return t(`blocks.placeholder.kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`)
}
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.placeholder.label') }}</span>
      <Input :model-value="placeholderLabel(model)" type="text" :placeholder="t('blocks.placeholder.labelPlaceholder')" @update:model-value="value => model = { ...model, label: String(value) }" />
    </Label>
    <Label>
      <span>{{ t('blocks.placeholder.kind') }}</span>
      <Select :model-value="model.kind" @update:model-value="value => model = { ...model, kind: resolvePlaceholderKind(value) }">
        <SelectTrigger>
          <SelectValue :placeholder="kindLabel('box')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="kind in PLACEHOLDER_KINDS" :key="kind" :value="kind">
            {{ kindLabel(kind) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </Label>
    <Label>
      <span>{{ t('blocks.placeholder.ratio') }}</span>
      <Select :model-value="placeholderRatio(model)" @update:model-value="value => model = { ...model, ratio: value as PlaceholderBlockProps['ratio'] }">
        <SelectTrigger>
          <SelectValue :placeholder="t('blocks.placeholder.ratioAuto')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="ratio in PLACEHOLDER_RATIOS" :key="ratio" :value="ratio">
            {{ ratio === 'auto' ? t('blocks.placeholder.ratioAuto') : ratio }}
          </SelectItem>
        </SelectContent>
      </Select>
    </Label>
  </div>
</template>
