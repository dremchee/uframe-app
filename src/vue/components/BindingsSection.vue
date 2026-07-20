<script setup lang="ts">
import { Database } from '@lucide/vue'
import { computed } from 'vue'
import { findDataScopeCollection } from '@/core'
import BindingPicker from '@/vue/components/BindingPicker.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

// Dedicated "Data bindings" section of the block settings panel. Lists the
// block's `bindableProps` and, per prop, a field picker writing block.bindings.
// Only meaningful inside a Collection List/Item (where `item.*` has a record);
// otherwise it explains how to enable binding instead of showing dead rows.
const props = defineProps<{
  propKeys: string[]
  labels?: Record<string, string>
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()
const block = computed(() => editor.selectedBlock.value)

// The collection providing `item.*`, or null when the block is outside any
// Collection List/Item.
const scopeCollection = computed(() =>
  block.value ? findDataScopeCollection(editor.document.value.blocks, block.value.id) : null,
)

function label(key: string): string {
  const explicit = props.labels?.[key]
  if (explicit)
    return explicit
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, c => c.toUpperCase())
    .trim()
}
</script>

<template>
  <!-- Bindings only make sense inside a Data List/Item — hidden otherwise. -->
  <section v-if="scopeCollection" class="grid gap-2">
    <div class="flex items-center gap-1.5 text-sm font-semibold text-uf-text">
      <Database :size="14" :stroke-width="2" class="text-uf-muted" />
      {{ t('properties.bindings') }}
      <span class="text-[11px] font-normal text-uf-muted">· {{ scopeCollection }}</span>
    </div>

    <div v-for="key in propKeys" :key="key" class="grid gap-1">
      <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">
        {{ label(key) }}
      </span>
      <BindingPicker :prop="key" />
    </div>
  </section>
</template>
