<script setup lang="ts">
import type { ContainerQueryDirection, ContainerVariant } from '@/core'
import type { ContainerAncestor, ContainerParent } from '@/vue/composables/style/useContainerAncestors'
import { Box, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import {
  Button,
  Label,
  NumberField,
  NumberFieldContent,
  NumberFieldInput,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
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
  'activate-container-variant': [id: string]
  'add-container-variant': [draft: Omit<ContainerVariant, 'style'>]
  'update-container-variant': [id: string, patch: Partial<Omit<ContainerVariant, 'style'>>]
  'remove-container-variant': [id: string]
  'enable-container': [blockId: string]
  'highlight-container': [highlighted: boolean]
  'request-add-condition': []
}>()

const { t } = useUframeI18n()
const draftContainer = shallowRef('')
const draftDirection = shallowRef<ContainerQueryDirection>('max')
const draftWidth = shallowRef(480)
const isCreating = shallowRef(false)
const editingVariantId = shallowRef<string | null>(null)
const deletingVariantId = shallowRef<string | null>(null)
const editDirection = shallowRef<ContainerQueryDirection>('max')
const editWidth = shallowRef(480)

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
    // A new condition starts from the live preview width. Keep that draft in
    // sync while the author resizes the container on the canvas.
    if (width != null && (isCreating.value || !variantEntries.value.length))
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

function activateVariant(id: string) {
  emit('update:containerVariantId', id)
  emit('activate-container-variant', id)
}

function startCreating() {
  if (currentWidth.value != null)
    draftWidth.value = currentWidth.value
  setCreating(true)
  emit('request-add-condition')
}

function setCreating(open: boolean) {
  isCreating.value = open
}

function addVariant() {
  if (!draftContainer.value || !Number.isFinite(draftWidth.value))
    return
  emit('add-container-variant', {
    container: draftContainer.value,
    direction: draftDirection.value,
    width: draftWidth.value,
  })
  setCreating(false)
}

function updateSelected(patch: Partial<Omit<ContainerVariant, 'style'>>) {
  if (props.containerVariantId)
    emit('update-container-variant', props.containerVariantId, patch)
}

function startEditing(id: string, variant: ContainerVariant) {
  editingVariantId.value = id
  editDirection.value = variant.direction
  editWidth.value = variant.width
}

function saveEditing() {
  if (!editingVariantId.value || !Number.isFinite(editWidth.value))
    return
  emit('update-container-variant', editingVariantId.value, {
    direction: editDirection.value,
    width: editWidth.value,
  })
  emit('update:containerVariantId', editingVariantId.value)
  editingVariantId.value = null
}

function confirmRemove() {
  if (!deletingVariantId.value)
    return
  emit('remove-container-variant', deletingVariantId.value)
  deletingVariantId.value = null
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

    <template v-if="variantEntries.length">
      <div class="grid gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
            {{ t('style.conditions') }}
          </span>
          <Popover :open="isCreating" @update:open="setCreating">
            <div class="relative">
              <PopoverAnchor class="pointer-events-none absolute inset-0" />
              <Button variant="ghost" size="icon" class="size-6" :aria-label="t('style.addCondition')" @click="startCreating">
                <Plus :size="14" />
              </Button>
            </div>
            <PopoverContent class="w-64" align="end" :title="t('style.addCondition')" @interact-outside="preventOverlayDismiss" @focus-outside="(event: Event) => event.preventDefault()">
              <form class="flex flex-col gap-3" @submit.prevent="addVariant">
                <Label>
                  <span>{{ t('style.whenWidth') }}</span>
                  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-1.5">
                    <Select v-model="draftDirection"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="max">≤</SelectItem><SelectItem value="min">≥</SelectItem></SelectContent></Select>
                    <NumberField v-model="draftWidth" :min="1"><NumberFieldContent><NumberFieldInput :aria-label="t('style.containerWidth')" /><span class="pr-2 text-xs text-uf-muted">px</span></NumberFieldContent></NumberField>
                  </div>
                </Label>
                <div class="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" @click="setCreating(false)">
                    {{ t('common.cancel') }}
                  </Button><Button type="submit" size="sm">
                    {{ t('common.add') }}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
        <div class="flex flex-col gap-1">
          <div
            v-for="[id, variant] in variantEntries"
            :key="id"
            class="group flex h-9 items-center gap-1.5 rounded-md border border-uf-border bg-uf-panel pl-2 pr-1"
            :class="id === containerVariantId && 'border-uf-accent/60 bg-uf-panel-muted/40'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-1.5 text-left text-[12px] text-uf-text cursor-pointer"
              @click="activateVariant(id)"
            >
              <span class="shrink-0 font-medium text-uf-muted">{{ variant.direction === 'min' ? '≥' : '≤' }}</span>
              <span class="truncate">{{ variant.width }} px</span>
            </button>
            <Popover :open="editingVariantId === id" @update:open="(open: boolean) => (open ? startEditing(id, variant) : (editingVariantId = null))">
              <div class="relative">
                <PopoverAnchor class="pointer-events-none absolute inset-0" />
                <button
                  type="button"
                  class="inline-flex size-6 items-center justify-center rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
                  :aria-label="t('common.edit')"
                  @click="startEditing(id, variant)"
                >
                  <Pencil :size="13" :stroke-width="1.75" />
                </button>
              </div>
              <PopoverContent
                class="w-64"
                align="end"
                :title="t('common.edit')"
                @interact-outside="preventOverlayDismiss"
                @focus-outside="(event: Event) => event.preventDefault()"
              >
                <form class="flex flex-col gap-3" @submit.prevent="saveEditing">
                  <Label>
                    <span>{{ t('style.whenWidth') }}</span>
                    <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-1.5">
                      <Select v-model="editDirection">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="max">≤</SelectItem>
                          <SelectItem value="min">≥</SelectItem>
                        </SelectContent>
                      </Select>
                      <NumberField v-model="editWidth" :min="1">
                        <NumberFieldContent>
                          <NumberFieldInput :aria-label="t('style.containerWidth')" />
                          <span class="pr-2 text-xs text-uf-muted">px</span>
                        </NumberFieldContent>
                      </NumberField>
                    </div>
                  </Label>
                  <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" @click="editingVariantId = null">
                      {{ t('common.cancel') }}
                    </Button>
                    <Button type="submit" size="sm">
                      {{ t('common.save') }}
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
            <Popover :open="deletingVariantId === id" @update:open="(open: boolean) => (deletingVariantId = open ? id : null)">
              <div class="relative">
                <PopoverAnchor class="pointer-events-none absolute inset-0" />
                <button
                  type="button"
                  class="inline-flex size-6 items-center justify-center rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-danger"
                  :aria-label="t('style.removeContainerVariant')"
                  @click="deletingVariantId = id"
                >
                  <Trash2 :size="13" :stroke-width="1.75" />
                </button>
              </div>
              <PopoverContent
                class="w-60"
                align="end"
                :title="t('style.removeContainerVariant')"
                @interact-outside="preventOverlayDismiss"
                @focus-outside="(event: Event) => event.preventDefault()"
              >
                <div class="flex flex-col gap-3">
                  <p class="m-0 text-xs leading-snug text-uf-text">
                    {{ variant.direction === 'min' ? '≥' : '≤' }} {{ variant.width }} px
                  </p>
                  <div class="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" @click="deletingVariantId = null">
                      {{ t('common.cancel') }}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" @click="confirmRemove">
                      {{ t('common.remove') }}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <Popover :open="isCreating" @update:open="setCreating">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-uf-muted">{{ t('style.conditions') }}</span>
          <div class="relative">
            <PopoverAnchor class="pointer-events-none absolute inset-0" />
            <Button variant="ghost" size="icon" class="size-6" :aria-label="t('style.addCondition')" @click="startCreating">
              <Plus :size="14" />
            </Button>
          </div>
        </div>
        <PopoverContent class="w-64" align="end" :title="t('style.addCondition')" @interact-outside="preventOverlayDismiss" @focus-outside="(event: Event) => event.preventDefault()">
          <form class="flex flex-col gap-3" @submit.prevent="addVariant">
            <Label><span>{{ t('style.whenWidth') }}</span><div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-1.5"><Select v-model="draftDirection"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="max">≤</SelectItem><SelectItem value="min">≥</SelectItem></SelectContent></Select><NumberField v-model="draftWidth" :min="1"><NumberFieldContent><NumberFieldInput :aria-label="t('style.containerWidth')" /><span class="pr-2 text-xs text-uf-muted">px</span></NumberFieldContent></NumberField></div></Label>
            <div class="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" @click="setCreating(false)">
                {{ t('common.cancel') }}
              </Button><Button type="submit" size="sm">
                {{ t('common.add') }}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </template>
  </div>
</template>
