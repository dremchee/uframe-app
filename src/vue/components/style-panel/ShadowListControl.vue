<script setup lang="ts">
import type { ShadowEntry } from '@/core'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui'
import { appendListItem, defaultShadow, moveListItem, removeListItem, replaceListItem } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import ShadowRow from './ShadowRow.vue'

const props = defineProps<{
  modelValue?: ShadowEntry[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ShadowEntry[] | undefined]
}>()
const { t } = useUframeI18n()

/** Empty list → undefined, so the style key clears (drops the modified marker). */
function commit(next: ShadowEntry[]) {
  emit('update:modelValue', next.length ? next : undefined)
}

function add() {
  commit(appendListItem(props.modelValue, defaultShadow()))
}

function update(index: number, entry: ShadowEntry) {
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
    <ShadowRow
      v-for="(entry, index) in (props.modelValue ?? [])"
      :key="entry.id"
      :entry="entry"
      :index="index"
      @update="update"
      @remove="remove"
      @reorder="reorder"
    />
    <Button variant="subtle" size="sm" class="w-full" :icon="Plus" @click="add">
      {{ t('style.addShadow') }}
    </Button>
  </div>
</template>
