<script setup lang="ts">
import type { BlockDataSource } from '@/core'
import { Database } from '@lucide/vue'
import { computed } from 'vue'
import { Label, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui'
import { DATA_LIST_BLOCK_TYPE } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

// "Data source" section of a Data List / Data Item block's settings:
// picks the collection and (for lists) sort + limit. Writes block.source.
const { editor, schema } = useEditorContext()
const { t } = useUframeI18n()
const block = computed(() => editor.selectedBlock.value)
const isList = computed(() => block.value?.type === DATA_LIST_BLOCK_TYPE)

const collections = computed(() => schema.value.collections)
const sourceFields = computed(() =>
  collections.value.find(c => c.name === collection.value)?.fields ?? [],
)

function patch(p: Partial<BlockDataSource>) {
  if (!block.value)
    return
  const current = block.value.source ?? { collection: '' }
  editor.setBlockSource(block.value.id, { ...current, ...p })
}

const collection = computed<string>({
  get: () => block.value?.source?.collection ?? '',
  set: value => patch({ collection: value }),
})

const limit = computed<number | undefined>({
  get: () => block.value?.source?.limit,
  set: value => patch({ limit: value ? Number(value) : undefined }),
})

// Sort is a single `field` / `-field` entry for v1.
const sortField = computed<string>({
  get: () => (block.value?.source?.sort?.[0] ?? '').replace(/^-/, ''),
  set: value => patch({ sort: value ? [descending.value ? `-${value}` : value] : undefined }),
})
const descending = computed<boolean>({
  get: () => (block.value?.source?.sort?.[0] ?? '').startsWith('-'),
  set: (value) => {
    const field = sortField.value
    patch({ sort: field ? [value ? `-${field}` : field] : undefined })
  },
})
</script>

<template>
  <section class="grid gap-2">
    <div class="flex items-center gap-1.5 text-sm font-semibold text-uf-text">
      <Database :size="14" :stroke-width="2" class="text-uf-muted" />
      {{ t('properties.dataSource') }}
    </div>

    <Label>
      <span>{{ t('properties.collection') }}</span>
      <Select v-model="collection">
        <SelectTrigger>
          <SelectValue :placeholder="t('properties.pickCollection')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="c in collections" :key="c.name" :value="c.name">
            {{ c.label ?? c.name }}{{ c.kind === 'singleton' ? ` (${t('properties.singleton')})` : '' }}
          </SelectItem>
        </SelectContent>
      </Select>
    </Label>

    <template v-if="isList">
      <Label>
        <span>{{ t('properties.sortBy') }}</span>
        <Select v-model="sortField">
          <SelectTrigger>
            <SelectValue :placeholder="t('properties.none')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="f in sourceFields" :key="f.name" :value="f.name">
              {{ f.label ?? f.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Label>

      <Label class="flex-row items-center justify-between">
        <span>{{ t('properties.descending') }}</span>
        <Switch v-model="descending" />
      </Label>

      <Label>
        <span>{{ t('properties.limit') }}</span>
        <NumberField
          :model-value="limit ?? undefined"
          :min="1"
          @update:model-value="value => limit = Number.isFinite(value) ? value : undefined"
        >
          <NumberFieldContent>
            <NumberFieldInput :placeholder="t('properties.noLimit')" />
            <NumberFieldStepper>
              <NumberFieldIncrement />
              <NumberFieldDecrement />
            </NumberFieldStepper>
          </NumberFieldContent>
        </NumberField>
      </Label>
    </template>
  </section>
</template>
