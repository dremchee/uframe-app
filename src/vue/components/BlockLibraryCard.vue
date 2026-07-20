<script setup lang="ts">
import type { BlockDefinition } from '@/core'
import { computed, toRef, useTemplateRef } from 'vue'
import { Card, CardDescription, CardTitle } from '@/components/ui'
import { useBlockCardDraggable } from '@/vue/composables/dnd/useBlockCardDraggable'
import { useUframeI18n } from '@/vue/i18n'
import { localizedBlockDescription, localizedBlockLabel } from '@/vue/utils/block-label'

const props = defineProps<{
  block: BlockDefinition
}>()

const emit = defineEmits<{
  add: [type: string]
}>()

const { t } = useUframeI18n()
const label = computed(() => localizedBlockLabel(props.block.type, props.block, t))
const description = computed(() => localizedBlockDescription(props.block.type, props.block, t))

const el = useTemplateRef<HTMLElement>('el')
useBlockCardDraggable(
  el,
  toRef(() => props.block.type),
)
</script>

<template>
  <Card
    ref="el"
    class="flex items-center gap-2.5 px-2.5 py-2 text-left cursor-grab active:cursor-grabbing transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    role="button"
    tabindex="0"
    @click="emit('add', block.type)"
    @keydown.enter.prevent="emit('add', block.type)"
    @keydown.space.prevent="emit('add', block.type)"
  >
    <span
      v-if="block.icon"
      class="grid place-items-center shrink-0 size-8 rounded-md bg-uf-accent/10 text-uf-accent"
    >
      <component
        :is="block.icon"
        :size="16"
        :stroke-width="1.75"
        aria-hidden="true"
      />
    </span>
    <div class="flex flex-col gap-0.5 min-w-0">
      <CardTitle class="text-sm">
        {{ label }}
      </CardTitle>
      <CardDescription v-if="description" class="text-[11px] leading-tight">
        {{ description }}
      </CardDescription>
    </div>
  </Card>
</template>
