<script setup lang="ts">
import type { SettingsField } from '@/core'
import { ColorInput, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'
import { localizedLabel, localizedPlaceholder } from '@/vue/utils/translation-fallback'

// Renders the Content tab for blocks that opt into schema-driven settings
// (definition.settings) instead of a Vue `settingsComponent`. Binds each field
// to `props[key]`; the properties panel deep-watches the bound object and
// commits the change, same as a hand-written settings component.
defineProps<{ fields: SettingsField[] }>()
const model = defineModel<Record<string, unknown>>({ required: true })
const { t } = useUframeI18n()

function fieldLabel(field: SettingsField): string {
  const translated = localizedLabel(field, t)
  if (translated)
    return translated
  if (field.label)
    return field.label
  return field.key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, c => c.toUpperCase())
    .trim()
}

function fieldPlaceholder(field: SettingsField): string | undefined {
  return localizedPlaceholder(field, t)
}

function optionLabel(option: { label: string, labelKey?: string }): string {
  return localizedLabel(option, t) ?? option.label
}
</script>

<template>
  <div class="grid gap-2">
    <Label v-for="field in fields" :key="field.key">
      <span>{{ fieldLabel(field) }}</span>

      <Switch v-if="field.type === 'boolean'" v-model="model[field.key] as boolean" />

      <Select v-else-if="field.type === 'select'" v-model="model[field.key] as string">
        <SelectTrigger>
          <SelectValue :placeholder="fieldPlaceholder(field)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in field.options" :key="String(option.value)" :value="option.value">
            {{ optionLabel(option) }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Textarea v-else-if="field.type === 'textarea'" v-model="model[field.key] as string" :placeholder="fieldPlaceholder(field)" />

      <ColorInput v-else-if="field.type === 'color'" v-model="model[field.key] as string" />

      <Input
        v-else
        v-model="model[field.key] as string | number"
        :type="field.type === 'number' ? 'number' : 'text'"
        :placeholder="fieldPlaceholder(field)"
      />
    </Label>
  </div>
</template>
