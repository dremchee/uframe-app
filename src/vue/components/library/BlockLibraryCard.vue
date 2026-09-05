<script setup lang="ts">
import type { BlockDefinition, BlockPreset } from '@/core'
import { computed, toRef, useTemplateRef } from 'vue'
import { Card, CardDescription, CardTitle } from '@/components/ui'
import BlockPresetPreview from '@/vue/components/library/BlockPresetPreview.vue'
import { useBlockCardDraggable } from '@/vue/composables/dnd/useBlockCardDraggable'
import { useUframeI18n } from '@/vue/i18n'
import { localizedBlockDescription, localizedBlockLabel, localizedPresetDescription, localizedPresetLabel } from '@/vue/utils/block-label'

// One Add-panel card: either the plain block (`preset` absent) or one of the
// block's presets. Both drag and click resolve to the same `type`; the preset
// id rides along so the editor can build the preset's starting shape.
const props = defineProps<{
  block: BlockDefinition
  preset?: BlockPreset
}>()

const emit = defineEmits<{
  add: [type: string, presetId?: string]
}>()

const { t } = useUframeI18n()
const label = computed(() => props.preset
  ? localizedPresetLabel(props.preset, t)
  : localizedBlockLabel(props.block.type, props.block, t))
const description = computed(() => props.preset
  ? localizedPresetDescription(props.preset, t)
  : localizedBlockDescription(props.block.type, props.block, t))
const icon = computed(() => props.preset?.icon ?? props.block.icon)

const el = useTemplateRef<HTMLElement>('el')
useBlockCardDraggable(
  el,
  toRef(() => props.block.type),
  toRef(() => props.preset?.id),
)

function add() {
  emit('add', props.block.type, props.preset?.id)
}
</script>

<template>
  <Card
    ref="el"
    class="flex items-center gap-2.5 px-2.5 py-2 text-left cursor-grab active:cursor-grabbing transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    role="button"
    tabindex="0"
    @click="add"
    @keydown.enter.prevent="add"
    @keydown.space.prevent="add"
  >
    <BlockPresetPreview v-if="preset" :preset="preset" />
    <span
      v-else-if="icon"
      class="grid place-items-center shrink-0 size-8 rounded-md bg-uf-accent/10 text-uf-accent"
    >
      <component
        :is="icon"
        :size="16"
        :stroke-width="1.75"
        aria-hidden="true"
      />
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <CardTitle class="text-sm">
        {{ label }}
      </CardTitle>
      <CardDescription v-if="description" class="text-[11px] leading-tight">
        {{ description }}
      </CardDescription>
    </div>
  </Card>
</template>
