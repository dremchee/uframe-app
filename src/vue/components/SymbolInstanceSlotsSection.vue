<script setup lang="ts">
import type { PageBlock, SymbolDefinition } from '@/core'
import { computed } from 'vue'
import { Button } from '@/components/ui'
import { getInstanceSlotFills, getSymbolSlots } from '@/core'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  instance: PageBlock
  symbol: SymbolDefinition
}>()

const emit = defineEmits<{
  reset: [slotId: string]
  edit: [slotId: string]
}>()

const { t } = useUframeI18n()

const rows = computed(() => {
  const filled = new Set(getInstanceSlotFills(props.instance).map(fill => fill.props.slotId))
  return getSymbolSlots(props.symbol).map(slot => ({
    id: slot.id,
    name: slot.props.name,
    // Overridden = this instance carries its own fill (custom or emptied).
    overridden: filled.has(slot.id),
  }))
})
</script>

<template>
  <section v-if="rows.length" class="flex flex-col gap-2">
    <span class="text-[11px] uppercase tracking-wider font-semibold text-uf-muted">{{ t('properties.slots') }}</span>
    <div
      v-for="row in rows"
      :key="row.id"
      class="flex flex-col gap-2 rounded-md border border-uf-border p-2.5"
    >
      <span class="min-w-0 truncate text-xs font-medium text-uf-text">{{ row.name }}</span>
      <div class="flex flex-wrap gap-1.5">
        <!-- Edits the slot element itself (inside the master), so it's always
             available regardless of whether this instance overrides the slot. -->
        <Button
          variant="outline"
          size="sm"
          @click="emit('edit', row.id)"
        >
          {{ t('properties.editSlot') }}
        </Button>
        <Button
          v-if="row.overridden"
          variant="ghost"
          size="sm"
          @click="emit('reset', row.id)"
        >
          {{ t('common.reset') }}
        </Button>
      </div>
    </div>
  </section>
</template>
