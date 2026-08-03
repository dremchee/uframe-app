<script setup lang="ts">
import type { StateKey, ViewportKey } from './StyleVariantSelector.vue'
import type { BreakpointDef, ContainerVariant } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import type { ContainerAncestor, ContainerParent } from '@/vue/composables/style/useContainerAncestors'
import { Box } from '@lucide/vue'
import { computed } from 'vue'
import { Switch } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'
import ContainerVariantControl from './ContainerVariantControl.vue'
import StyleVariantSelector from './StyleVariantSelector.vue'

export type StyleContextMode = 'viewport' | 'container'

const props = defineProps<{
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

const { t } = useUframeI18n()

const parentLabel = computed(() => {
  const selectedContainerName = props.containerVariantId
    ? props.variants[props.containerVariantId]?.container
    : undefined
  const selectedContainer = props.containers.find(
    container => container.name === selectedContainerName,
  )

  return selectedContainer?.label
    ?? props.containers[0]?.label
    ?? props.nearestParent?.label
})

function setContainerMode(enabled: boolean) {
  emit('update:mode', enabled ? 'container' : 'viewport')
}
</script>

<template>
  <div class="mb-2 grid gap-2">
    <div class="grid gap-1">
      <span class="text-[11px] font-semibold uppercase tracking-wider text-uf-muted">
        {{ t('style.stylesFor') }}
      </span>
      <div class="flex min-h-10 items-center justify-between gap-3 rounded-md border border-uf-border px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <Box :size="15" class="shrink-0 text-uf-muted" aria-hidden="true" />
          <span class="grid min-w-0 gap-0.5">
            <span class="truncate text-sm font-medium text-uf-text">
              {{ t('style.containerStyles') }}
            </span>
            <span v-if="parentLabel" class="truncate text-[11px] leading-none text-uf-muted">
              {{ t('style.parentBlock') }}: {{ parentLabel }}
            </span>
          </span>
        </div>
        <Switch
          :model-value="mode === 'container'"
          :aria-label="t('style.containerStyles')"
          @update:model-value="setContainerMode"
        />
      </div>
    </div>

    <StyleVariantSelector
      v-if="mode === 'viewport'"
      :viewport="viewport"
      :state="state"
      :breakpoints="breakpoints"
      @update:viewport="emit('update:viewport', $event)"
      @update:state="emit('update:state', $event)"
      @add-breakpoint="emit('add-breakpoint', $event)"
    />

    <ContainerVariantControl
      v-else
      :nearest-parent="nearestParent"
      :containers="containers"
      :variants="variants"
      :container-variant-id="containerVariantId"
      :container-width="containerWidth"
      @update:container-variant-id="emit('update:containerVariantId', $event)"
      @add-container-variant="emit('add-container-variant', $event)"
      @update-container-variant="(id, patch) => emit('update-container-variant', id, patch)"
      @remove-container-variant="emit('remove-container-variant', $event)"
      @enable-container="emit('enable-container', $event)"
      @highlight-container="emit('highlight-container', $event)"
    />
  </div>
</template>
