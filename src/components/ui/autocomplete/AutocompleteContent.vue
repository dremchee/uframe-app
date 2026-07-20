<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui'
import {
  AutocompleteContent,
  AutocompletePortal,
  AutocompleteViewport,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { usePortalTarget } from '@/components/ui/portal-target'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ComboboxContentProps & { class?: string }>(), {
  position: 'popper',
  sideOffset: 4,
})
const emit = defineEmits<ComboboxContentEmits>()

const forwarded = useForwardPropsEmits(props, emit)
const portalTarget = usePortalTarget()
const classes = computed(() => cn(
  'uf-overlay uf-ui-autocomplete-content',
  'z-50 overflow-hidden rounded-md border border-uf-border bg-uf-panel text-uf-text shadow-md',
  // Popper positioning tracks the anchor and flips at viewport edges; the
  // list spans the whole anchored field, like a native datalist would.
  props.position === 'popper' && 'w-(--reka-combobox-trigger-width)',
  props.class,
))
</script>

<template>
  <AutocompletePortal :to="portalTarget ?? undefined">
    <AutocompleteContent v-bind="forwarded" :class="classes">
      <!-- The viewport is the scroll container the virtualizer measures. -->
      <AutocompleteViewport class="max-h-48 py-1">
        <slot />
      </AutocompleteViewport>
    </AutocompleteContent>
  </AutocompletePortal>
</template>
