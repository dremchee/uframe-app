<script setup lang="ts">
import type { BlockDataSource } from '@/core'
import { Database } from '@lucide/vue'
import { computed } from 'vue'
import { Label, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { DATA_LIST_BLOCK_TYPE } from './types'

const { editor, schema } = useEditorContext()
const { t } = useUframeI18n()
const block = computed(() => editor.selectedBlock.value)
const isList = computed(() => block.value?.type === DATA_LIST_BLOCK_TYPE)
const collections = computed(() => schema.value.collections)
const collection = computed<string>({
  get: () => block.value?.source?.collection ?? '',
  set: value => patch({ collection: value }),
})
const sourceFields = computed(() => collections.value.find(item => item.name === collection.value)?.fields ?? [])
const limit = computed<number | undefined>({
  get: () => block.value?.source?.limit,
  set: value => patch({ limit: value ? Number(value) : undefined }),
})
const descending = computed({
  get: () => (block.value?.source?.sort?.[0] ?? '').startsWith('-'),
  set: value => patch({ sort: sortField.value ? [value ? `-${sortField.value}` : sortField.value] : undefined }),
})
const sortField = computed<string>({
  get: () => (block.value?.source?.sort?.[0] ?? '').replace(/^-/, ''),
  set: value => patch({ sort: value ? [descending.value ? `-${value}` : value] : undefined }),
})
function patch(next: Partial<BlockDataSource>) {
  if (block.value)
    editor.setBlockSource(block.value.id, { ...(block.value.source ?? { collection: '' }), ...next })
}
</script>

<template>
  <section class="grid gap-2">
    <div class="flex items-center gap-1.5 text-sm font-semibold text-uf-text">
      <Database :size="14" :stroke-width="2" class="text-uf-muted" />
      {{ t('properties.dataSource') }}
    </div>
    <Label><span>{{ t('properties.collection') }}</span><Select v-model="collection"><SelectTrigger><SelectValue :placeholder="t('properties.pickCollection')" /></SelectTrigger><SelectContent><SelectItem v-for="item in collections" :key="item.name" :value="item.name">{{ item.label ?? item.name }}{{ item.kind === 'singleton' ? ` (${t('properties.singleton')})` : '' }}</SelectItem></SelectContent></Select></Label>
    <template v-if="isList">
      <Label><span>{{ t('properties.sortBy') }}</span><Select v-model="sortField"><SelectTrigger><SelectValue :placeholder="t('properties.none')" /></SelectTrigger><SelectContent><SelectItem v-for="field in sourceFields" :key="field.name" :value="field.name">{{ field.label ?? field.name }}</SelectItem></SelectContent></Select></Label>
      <Label class="flex-row items-center justify-between"><span>{{ t('properties.descending') }}</span><Switch v-model="descending" /></Label>
      <Label><span>{{ t('properties.limit') }}</span><NumberField :model-value="limit ?? undefined" :min="1" @update:model-value="value => limit = Number.isFinite(value) ? value : undefined"><NumberFieldContent><NumberFieldInput :placeholder="t('properties.noLimit')" /><NumberFieldStepper><NumberFieldIncrement /><NumberFieldDecrement /></NumberFieldStepper></NumberFieldContent></NumberField></Label>
    </template>
  </section>
</template>
