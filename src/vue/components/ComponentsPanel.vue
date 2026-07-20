<script setup lang="ts">
import type { SymbolDefinition } from '@/core'
import { ScrollArea } from '@/components/ui'
import SymbolLibraryCard from '@/vue/components/SymbolLibraryCard.vue'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{
  symbols?: SymbolDefinition[]
}>()

const emit = defineEmits<{
  'add-symbol': [symbolId: string]
  'remove-symbol': [symbolId: string]
}>()

const { t } = useUframeI18n()
</script>

<template>
  <section class="flex flex-col min-h-0 h-full overflow-hidden">
    <ScrollArea class="flex-1 min-h-0 flex flex-col gap-1.5 p-3 overflow-auto">
      <SymbolLibraryCard
        v-for="symbol in symbols ?? []"
        :key="symbol.id"
        :symbol="symbol"
        @add="emit('add-symbol', $event)"
        @remove="emit('remove-symbol', $event)"
      />
      <p
        v-if="!symbols?.length"
        class="px-2 py-6 text-center text-[12px] text-uf-muted leading-snug"
      >
        {{ t('properties.noComponents') }}
      </p>
    </ScrollArea>
  </section>
</template>
