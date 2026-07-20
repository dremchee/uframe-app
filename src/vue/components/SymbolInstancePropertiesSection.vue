<script setup lang="ts">
import type { PageBlock, SymbolDefinition, SymbolPropertyDefinition } from '@/core'
import { computed } from 'vue'
import {
  ColorInput,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'
import { getInstancePropertyValues, getSymbolPropertyDefault } from '@/core'
import BindingsSection from '@/vue/components/BindingsSection.vue'
import StyleField from '@/vue/components/style-panel/StyleField.vue'
import { useUframeI18n } from '@/vue/i18n'
import { localizedLabel, localizedPlaceholder } from '@/vue/utils/translation-fallback'

const props = defineProps<{
  instance: PageBlock
  symbol: SymbolDefinition
}>()

const emit = defineEmits<{
  change: [propertyId: string, value: unknown]
  reset: [propertyId: string]
}>()

const { t } = useUframeI18n()

const values = computed(() => getInstancePropertyValues(props.instance))
const propertyIds = computed(() => (props.symbol.properties ?? []).map(property => property.id))
const propertyLabels = computed(() => Object.fromEntries(
  (props.symbol.properties ?? []).map(property => [property.id, localizedLabel(property, t) ?? property.label]),
))

function propertyLabel(property: SymbolPropertyDefinition): string {
  return localizedLabel(property, t) ?? property.label
}

function optionLabel(option: { label: string, labelKey?: string }): string {
  return localizedLabel(option, t) ?? option.label
}

function propertyPlaceholder(property: SymbolPropertyDefinition): string | undefined {
  return localizedPlaceholder(property.control, t)
}

function hasOverride(propertyId: string): boolean {
  return Object.hasOwn(values.value, propertyId)
}

function propertyValue(property: SymbolPropertyDefinition): unknown {
  return hasOverride(property.id)
    ? values.value[property.id]
    : getSymbolPropertyDefault(props.symbol, property)
}

function stringValue(property: SymbolPropertyDefinition): string {
  const value = propertyValue(property)
  return value == null ? '' : String(value)
}

function numberValue(property: SymbolPropertyDefinition): number | string {
  const value = propertyValue(property)
  return typeof value === 'number' ? value : ''
}

function selectValue(property: SymbolPropertyDefinition): string | number | undefined {
  const value = propertyValue(property)
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

function updateValue(property: SymbolPropertyDefinition, value: unknown) {
  if (property.control.type === 'number' && typeof value === 'number' && !Number.isFinite(value)) {
    emit('reset', property.id)
    return
  }
  emit('change', property.id, value)
}
</script>

<template>
  <section v-if="symbol.properties?.length" class="flex flex-col gap-3">
    <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">
      {{ t('properties.properties') }}
    </span>

    <!-- Same field chrome as the style panel (e.g. Corner shape): accent
         label while overridden + a hover-revealed compact reset icon. -->
    <StyleField
      v-for="property in symbol.properties"
      :key="property.id"
      :label="propertyLabel(property)"
      :modified="hasOverride(property.id)"
      @reset="emit('reset', property.id)"
    >
      <Switch
        v-if="property.control.type === 'boolean'"
        :model-value="Boolean(propertyValue(property))"
        @update:model-value="value => emit('change', property.id, value)"
      />

      <Select
        v-else-if="property.control.type === 'select'"
        :model-value="selectValue(property)"
        @update:model-value="value => emit('change', property.id, value)"
      >
        <SelectTrigger>
          <SelectValue :placeholder="propertyPlaceholder(property)" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="option in property.control.options ?? []"
              :key="String(option.value)"
              :value="option.value"
            >
              {{ optionLabel(option) }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Textarea
        v-else-if="property.control.type === 'textarea'"
        :model-value="stringValue(property)"
        :placeholder="propertyPlaceholder(property)"
        @update:model-value="value => emit('change', property.id, value)"
      />

      <ColorInput
        v-else-if="property.control.type === 'color'"
        :model-value="stringValue(property)"
        :placeholder="propertyPlaceholder(property)"
        @update:model-value="value => emit('change', property.id, value)"
      />

      <Input
        v-else
        :model-value="property.control.type === 'number' ? numberValue(property) : stringValue(property)"
        :type="property.control.type === 'number' ? 'number' : property.control.type === 'url' ? 'url' : 'text'"
        :placeholder="propertyPlaceholder(property)"
        @update:model-value="value => updateValue(property, value)"
      />
    </StyleField>

    <BindingsSection :prop-keys="propertyIds" :labels="propertyLabels" />
  </section>
</template>
