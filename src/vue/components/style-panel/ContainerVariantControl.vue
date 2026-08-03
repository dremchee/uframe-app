<script setup lang="ts">
import type { ContainerQueryDirection, ContainerVariant } from '@/core'
import type { ContainerAncestor, ContainerParent } from '@/vue/composables/style/useContainerAncestors'
import { Box, Plus, Trash2 } from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import {
  Button,
  NumberField,
  NumberFieldContent,
  NumberFieldInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  nearestParent?: ContainerParent
  containers: ContainerAncestor[]
  variants: Record<string, ContainerVariant>
  containerVariantId: string | null
  containerWidth: number | null
}>()

const emit = defineEmits<{
  'update:containerVariantId': [value: string | null]
  'add-container-variant': [draft: Omit<ContainerVariant, 'style'>]
  'update-container-variant': [id: string, patch: Partial<Omit<ContainerVariant, 'style'>>]
  'remove-container-variant': [id: string]
  'enable-container': [blockId: string]
  'highlight-container': [highlighted: boolean]
}>()

const { t } = useUframeI18n()
const draftContainer = shallowRef('')
const draftDirection = shallowRef<ContainerQueryDirection>('max')
const draftWidth = shallowRef(480)
const isCreating = shallowRef(false)

const variantEntries = computed(() => Object.entries(props.variants))
const selectedVariant = computed(() =>
  props.containerVariantId ? props.variants[props.containerVariantId] : undefined,
)
const displayedContainerName = computed(() =>
  isCreating.value || !selectedVariant.value
    ? draftContainer.value
    : selectedVariant.value.container,
)
const displayedContainer = computed(() =>
  props.containers.find(container => container.name === displayedContainerName.value)
  ?? props.containers[0],
)
const currentWidth = computed(() =>
  props.containerWidth == null ? null : Math.max(1, Math.round(props.containerWidth)),
)
const hasConditionAtCurrentWidth = computed(() => {
  const width = currentWidth.value
  const container = displayedContainerName.value
  if (width == null || !container)
    return false
  return variantEntries.value.some(([, variant]) =>
    variant.container === container
    && variant.direction === 'max'
    && variant.width === width,
  )
})

watch(
  [variantEntries, () => props.containerVariantId],
  ([entries, selectedId]) => {
    if (!selectedId && entries[0])
      emit('update:containerVariantId', entries[0][0])
  },
  { immediate: true },
)

watch(
  () => props.containers,
  (containers) => {
    if (!containers.some(container => container.name === draftContainer.value))
      draftContainer.value = containers[0]?.name ?? ''
  },
  { immediate: true },
)

watch(
  currentWidth,
  (width) => {
    if (width != null && !isCreating.value && !variantEntries.value.length)
      draftWidth.value = width
  },
  { immediate: true },
)

function updateParent(name: string) {
  if (isCreating.value || !selectedVariant.value) {
    draftContainer.value = name
    return
  }
  updateSelected({ container: name })
}

function startCreating() {
  if (currentWidth.value != null)
    draftWidth.value = currentWidth.value
  isCreating.value = true
}

function addVariant() {
  if (!draftContainer.value || !Number.isFinite(draftWidth.value))
    return
  emit('add-container-variant', {
    container: draftContainer.value,
    direction: draftDirection.value,
    width: draftWidth.value,
  })
  isCreating.value = false
}

function addVariantAtCurrentWidth() {
  const width = currentWidth.value
  const container = displayedContainerName.value
  if (width == null || !container || hasConditionAtCurrentWidth.value)
    return
  emit('add-container-variant', {
    container,
    direction: 'max',
    width,
  })
}

function updateSelected(patch: Partial<Omit<ContainerVariant, 'style'>>) {
  if (props.containerVariantId)
    emit('update-container-variant', props.containerVariantId, patch)
}
</script>

<template>
  <div
    v-if="!containers.length"
    class="grid gap-2 rounded-md border border-uf-border bg-uf-panel-muted/40 p-3"
  >
    <template v-if="nearestParent">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
        {{ t('style.parentBlock') }}
      </div>
      <div
        class="flex items-center gap-2 text-xs font-medium text-uf-text"
        @mouseenter="emit('highlight-container', true)"
        @mouseleave="emit('highlight-container', false)"
        @focusin="emit('highlight-container', true)"
        @focusout="emit('highlight-container', false)"
      >
        <Box :size="15" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ nearestParent.label }}</span>
        <span
          v-if="currentWidth != null"
          class="rounded-sm bg-uf-panel-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-uf-muted"
        >
          {{ currentWidth }} px
        </span>
      </div>
      <p class="m-0 text-[11px] leading-snug text-uf-muted">
        {{ t('style.parentNotAdaptive') }}
      </p>
      <Button size="sm" @click="emit('enable-container', nearestParent.blockId)">
        {{ t('style.useParentAsContainer') }}
      </Button>
    </template>
    <template v-else>
      <div class="text-xs font-medium text-uf-text">
        {{ t('style.noParent') }}
      </div>
      <p class="m-0 text-[11px] leading-snug text-uf-muted">
        {{ t('style.noParentHint') }}
      </p>
    </template>
  </div>

  <div v-else class="grid gap-3 rounded-md border border-uf-border p-2.5">
    <div
      class="grid gap-1"
      @mouseenter="emit('highlight-container', true)"
      @mouseleave="emit('highlight-container', false)"
      @focusin="emit('highlight-container', true)"
      @focusout="emit('highlight-container', false)"
    >
      <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
        {{ t('style.parentBlock') }}
      </span>
      <Select
        v-if="containers.length > 1"
        :model-value="displayedContainerName"
        @update:model-value="value => updateParent(String(value))"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="container in containers"
            :key="container.blockId"
            :value="container.name"
          >
            {{ container.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <div
        v-else
        class="flex h-9 items-center gap-2 rounded-md border border-uf-border bg-uf-panel-muted/40 px-3 text-sm text-uf-text"
      >
        <Box :size="14" class="text-uf-muted" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ displayedContainer?.label }}</span>
        <span
          v-if="currentWidth != null"
          class="rounded-sm bg-uf-panel px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-uf-muted"
        >
          {{ currentWidth }} px
        </span>
      </div>
    </div>

    <template v-if="variantEntries.length && !isCreating">
      <div class="grid gap-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
          {{ t('style.conditions') }}
        </span>
        <div class="flex flex-wrap gap-1.5">
          <Button
            v-for="[id, variant] in variantEntries"
            :key="id"
            :variant="id === containerVariantId ? 'secondary' : 'outline'"
            size="sm"
            @click="emit('update:containerVariantId', id)"
          >
            {{ variant.direction === 'min' ? '≥' : '≤' }} {{ variant.width }} px
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="h-8 w-8"
            :aria-label="t('style.addCondition')"
            @click="startCreating"
          >
            <Plus :size="14" />
          </Button>
        </div>
        <Button
          v-if="currentWidth != null"
          variant="outline"
          size="sm"
          class="mt-1 justify-start"
          :disabled="hasConditionAtCurrentWidth"
          @click="addVariantAtCurrentWidth"
        >
          <Plus :size="14" />
          {{ hasConditionAtCurrentWidth
            ? t('style.conditionExistsHere', { width: currentWidth })
            : t('style.addConditionHere', { width: currentWidth }) }}
        </Button>
      </div>

      <div v-if="selectedVariant" class="grid gap-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
          {{ t('style.whenWidth') }}
        </span>
        <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_2.25rem] gap-1.5">
          <Select
            :model-value="selectedVariant.direction"
            @update:model-value="value => updateSelected({ direction: value as ContainerQueryDirection })"
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="max">
                ≤
              </SelectItem>
              <SelectItem value="min">
                ≥
              </SelectItem>
            </SelectContent>
          </Select>
          <NumberField
            :model-value="selectedVariant.width"
            :min="1"
            @update:model-value="value => updateSelected({ width: Number(value) })"
          >
            <NumberFieldContent>
              <NumberFieldInput :aria-label="t('style.containerWidth')" />
              <span class="pr-2 text-xs text-uf-muted">px</span>
            </NumberFieldContent>
          </NumberField>
          <Button
            variant="ghost"
            size="icon"
            :aria-label="t('style.removeContainerVariant')"
            @click="containerVariantId && emit('remove-container-variant', containerVariantId)"
          >
            <Trash2 :size="14" />
          </Button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid gap-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
          {{ t('style.whenWidth') }}
        </span>
        <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-1.5">
          <Select v-model="draftDirection">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="max">
                ≤
              </SelectItem>
              <SelectItem value="min">
                ≥
              </SelectItem>
            </SelectContent>
          </Select>
          <NumberField v-model="draftWidth" :min="1">
            <NumberFieldContent>
              <NumberFieldInput :aria-label="t('style.containerWidth')" />
              <span class="pr-2 text-xs text-uf-muted">px</span>
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
      <div class="flex justify-end gap-1.5">
        <Button
          v-if="variantEntries.length"
          variant="ghost"
          size="sm"
          @click="isCreating = false"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button size="sm" @click="addVariant">
          <Plus :size="14" />
          {{ t('style.addCondition') }}
        </Button>
      </div>
    </template>
  </div>
</template>
