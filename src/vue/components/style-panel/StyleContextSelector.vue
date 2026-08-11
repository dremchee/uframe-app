<script setup lang="ts">
import type { StateKey, ViewportKey } from './StyleVariantSelector.vue'
import type { BreakpointDef, ContainerVariant } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import type { ContainerAncestor, ContainerParent } from '@/vue/composables/style/useContainerAncestors'
import ContainerVariantControl from './ContainerVariantControl.vue'
import StyleVariantSelector from './StyleVariantSelector.vue'

export type StyleContextMode = 'viewport' | 'container'

defineProps<{
  mode: StyleContextMode
  viewport: ViewportKey
  state: StateKey
  breakpoints: BreakpointDef[]
  nearestParent?: ContainerParent
  containers: ContainerAncestor[]
  variants: Record<string, ContainerVariant>
  containerVariantId: string | null
  containerWidth: number | null
}>()

const emit = defineEmits<{
  'update:mode': [value: StyleContextMode]
  'update:viewport': [value: ViewportKey]
  'update:state': [value: StateKey]
  'update:containerVariantId': [value: string | null]
  'add-breakpoint': [draft: BreakpointDraft]
  'add-container-variant': [draft: Omit<ContainerVariant, 'style'>]
  'update-container-variant': [id: string, patch: Partial<Omit<ContainerVariant, 'style'>>]
  'remove-container-variant': [id: string]
  'enable-container': [blockId: string]
  'highlight-container': [highlighted: boolean]
}>()

function startContainerCondition() {
  emit('update:containerVariantId', null)
  emit('update:mode', 'container')
}
</script>

<template>
  <div class="mb-2 grid gap-2">
    <ContainerVariantControl
      :nearest-parent="nearestParent"
      :containers="containers"
      :variants="variants"
      :container-variant-id="containerVariantId"
      :container-width="containerWidth"
      @update:container-variant-id="emit('update:containerVariantId', $event)"
      @activate-container-variant="emit('update:mode', 'container')"
      @request-add-condition="startContainerCondition"
      @add-container-variant="emit('add-container-variant', $event)"
      @update-container-variant="(id, patch) => emit('update-container-variant', id, patch)"
      @remove-container-variant="emit('remove-container-variant', $event)"
      @enable-container="emit('enable-container', $event)"
      @highlight-container="emit('highlight-container', $event)"
    />

    <StyleVariantSelector
      v-if="mode === 'viewport'"
      :viewport="viewport"
      :state="state"
      :breakpoints="breakpoints"
      @update:viewport="emit('update:viewport', $event)"
      @update:state="emit('update:state', $event)"
      @add-breakpoint="emit('add-breakpoint', $event)"
    />
  </div>
</template>
