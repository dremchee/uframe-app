<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import {
  Autocomplete,
  AutocompleteAnchor,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteVirtualizer,
  Tooltip,
} from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  modelValue: string
  /** Candidate class names to suggest (already filtered to the unapplied set). */
  suggestions: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  // Fired on Enter (typed text or highlighted suggestion) or on picking a row.
  'apply': [value: string]
}>()
const { t } = useUframeI18n()

const open = ref(false)
const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// The virtualized list opts out of reka's built-in filtering, so the options
// are pre-filtered here: substring match, case-insensitive. An empty query
// lists everything so the field doubles as a "browse existing classes"
// affordance, like the old datalist.
const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q)
    return props.suggestions
  return props.suggestions.filter(name => name.toLowerCase().includes(q))
})

const root = useTemplateRef<InstanceType<typeof Autocomplete>>('root')

function apply(name: string) {
  const value = name.trim()
  if (!value)
    return
  open.value = false
  emit('apply', value)
}

// reka's own Enter handling picks the highlighted row (and prevents the
// event before ours runs). A plain Enter — closed list or no highlight —
// always applies the non-empty typed text.
function onEnterKey(event: KeyboardEvent) {
  if (open.value && root.value?.highlightedElement)
    return
  event.preventDefault()
  apply(props.modelValue)
}
</script>

<template>
  <Autocomplete
    ref="root"
    v-model="model"
    v-model:open="open"
    class="relative min-w-0"
    ignore-filter
    open-on-focus
    open-on-click
  >
    <AutocompleteAnchor class="relative block min-w-0">
      <AutocompleteInput
        class="pr-9"
        :placeholder="placeholder"
        @keydown.enter="onEnterKey"
        @keydown.esc="open = false"
      />
      <!-- In-field apply trigger — same action as pressing Enter on typed text. -->
      <Tooltip :text="t('classes.add')">
        <button
          type="button"
          class="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uf-accent"
          :aria-label="t('classes.add')"
          @click="apply(modelValue)"
        >
          <Plus :size="14" :stroke-width="1.75" />
        </button>
      </Tooltip>
    </AutocompleteAnchor>

    <AutocompleteContent v-if="filtered.length">
      <!-- estimate-size matches the item row height (h-8). -->
      <AutocompleteVirtualizer v-slot="{ option }" :options="filtered" :estimate-size="32">
        <AutocompleteItem :value="option" @select.prevent="apply(String(option))">
          <span class="truncate">{{ option }}</span>
        </AutocompleteItem>
      </AutocompleteVirtualizer>
    </AutocompleteContent>
  </Autocomplete>
</template>
