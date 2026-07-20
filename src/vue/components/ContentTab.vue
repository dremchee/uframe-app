<script setup lang="ts">
import type { SettingsField } from '@/core'
import BindingsSection from '@/vue/components/BindingsSection.vue'
import SchemaSettings from '@/vue/components/SchemaSettings.vue'
import SourceSection from '@/vue/components/SourceSection.vue'

// Body of the block settings "Content" tab: data source (for Data List/Item),
// the props form (a Vue settingsComponent or schema-driven SchemaSettings), and
// the Data bindings section. Presentational — the panel computes the inputs and
// owns the props model (v-model). `settingsComponent` is `unknown` to match
// BlockDefinition's framework-agnostic component slot.
defineProps<{
  settingsComponent?: unknown
  settingsFields: SettingsField[] | null
  bindableProps: string[]
  isDataBlock: boolean
}>()

const model = defineModel<Record<string, unknown>>({ required: true })
</script>

<template>
  <div>
    <SourceSection v-if="isDataBlock" />
    <component :is="settingsComponent" v-if="settingsComponent" v-model="model" />
    <SchemaSettings v-else-if="settingsFields" v-model="model" :fields="settingsFields" />
    <BindingsSection
      v-if="bindableProps.length"
      :prop-keys="bindableProps"
      :class="{ 'mt-3 border-t border-uf-border pt-3': settingsComponent || settingsFields }"
    />
  </div>
</template>
