<script setup lang="ts">
import type { SymbolDefinition } from '@/core'
import { Component as ComponentIcon, Trash2 } from '@lucide/vue'
import { computed, ref, toRef, useTemplateRef } from 'vue'
import { Card, CardDescription, CardTitle, ConfirmDialog } from '@/components/ui'
import { useSymbolCardDraggable } from '@/vue/composables/dnd/useSymbolCardDraggable'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  symbol: SymbolDefinition
}>()

const emit = defineEmits<{
  add: [symbolId: string]
  remove: [symbolId: string]
}>()

const { t } = useUframeI18n()

const el = useTemplateRef<HTMLElement>('el')
useSymbolCardDraggable(el, toRef(() => props.symbol.id))

const removeDialogOpen = ref(false)
const removeDescription = computed(
  () => t('properties.deleteComponentDescription', { name: props.symbol.name }),
)

function askRemove(event: MouseEvent) {
  event.stopPropagation()
  removeDialogOpen.value = true
}
</script>

<template>
  <Card
    ref="el"
    class="group/symbol flex items-center gap-2.5 px-2.5 py-2 text-left cursor-grab active:cursor-grabbing transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    role="button"
    tabindex="0"
    @click="emit('add', symbol.id)"
    @keydown.enter.prevent="emit('add', symbol.id)"
    @keydown.space.prevent="emit('add', symbol.id)"
  >
    <span class="grid place-items-center shrink-0 size-8 rounded-md bg-uf-symbol/10 text-uf-symbol">
      <ComponentIcon
        :size="16"
        :stroke-width="1.75"
        aria-hidden="true"
      />
    </span>
    <div class="flex flex-col gap-0.5 min-w-0 flex-1">
      <CardTitle class="text-sm truncate text-uf-symbol">
        {{ symbol.name }}
      </CardTitle>
      <CardDescription class="text-[11px] leading-tight">
        {{ t('properties.component') }}
      </CardDescription>
    </div>
    <button
      type="button"
      class="opacity-0 group-hover/symbol:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      :aria-label="t('properties.deleteComponent', { name: symbol.name })"
      @click="askRemove"
    >
      <Trash2 :size="14" :stroke-width="1.75" />
    </button>
  </Card>

  <ConfirmDialog
    v-model:open="removeDialogOpen"
    :title="t('properties.deleteComponentTitle')"
    :description="removeDescription"
    :confirm-text="t('common.remove')"
    variant="destructive"
    @confirm="emit('remove', symbol.id)"
  />
</template>
