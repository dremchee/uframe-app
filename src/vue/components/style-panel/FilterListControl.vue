<script setup lang="ts">
import type { FilterEntry } from '@/core'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui'
import { appendListItem, defaultFilter, moveListItem, removeListItem, replaceListItem } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import FilterRow from './FilterRow.vue'

const props = defineProps<{
  modelValue?: FilterEntry[]
  /** Popover header for each row (e.g. "Filter" / "Backdrop filter"). */
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterEntry[] | undefined]
}>()
const { t } = useUframeI18n()

/** Empty list → undefined, so the style key clears (drops the modified marker). */
function commit(next: FilterEntry[]) {
  emit('update:modelValue', next.length ? next : undefined)
}

function add() {
  commit(appendListItem(props.modelValue, defaultFilter('blur')))
}

function update(index: number, entry: FilterEntry) {
  commit(replaceListItem(props.modelValue, index, entry))
}

function remove(index: number) {
  commit(removeListItem(props.modelValue, index))
}

function reorder(from: number, to: number) {
  commit(moveListItem(props.modelValue, from, to))
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <FilterRow
      v-for="(entry, index) in (props.modelValue ?? [])"
      :key="entry.id"
      :entry="entry"
      :index="index"
      :title="props.title"
      @update="update"
      @remove="remove"
      @reorder="reorder"
    />
    <Button variant="subtle" size="sm" class="w-full" :icon="Plus" @click="add">
      {{ t('style.addFilter') }}
    </Button>
  </div>
</template>
