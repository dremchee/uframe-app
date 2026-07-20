<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { OptionDraft } from './OptionForm.vue'
import { GripVertical, Pencil, Trash2 } from '@lucide/vue'
import { ref, toRef } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useRowReorderDnd } from '@/vue/composables/dnd/useRowReorderDnd'
import { useUframeI18n } from '@/vue/i18n'
import OptionForm from './OptionForm.vue'

const props = defineProps<{
  option: { id: string, label: string, value: string, selected: boolean }
  index: number
}>()

const emit = defineEmits<{
  update: [id: string, draft: OptionDraft]
  remove: [id: string]
  reorder: [from: number, to: number]
}>()
const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)

const editOpen = ref(false)
const editDraft = ref<OptionDraft>({ label: '', value: '', selected: false })

function onEditOpenChange(open: boolean) {
  if (open)
    editDraft.value = { label: props.option.label, value: props.option.value, selected: props.option.selected }
  editOpen.value = open
}

function submitEdit() {
  emit('update', props.option.id, { ...editDraft.value })
  editOpen.value = false
}

useRowReorderDnd({
  dragType: 'application/x-uf-select-option',
  el,
  handle,
  index: toRef(props, 'index'),
  onReorder: (from, to) => emit('reorder', from, to),
  setEdge: value => (edge.value = value),
  setDragging: value => (dragging.value = value),
})

const iconBtn = 'shrink-0 grid place-items-center size-6 rounded-md text-uf-muted hover:bg-uf-panel-muted hover:text-uf-text'
</script>

<template>
  <div
    ref="el"
    class="group relative flex items-center gap-1.5 rounded-md border bg-uf-panel shadow-xs pl-1.5 pr-1 h-9 transition-[opacity,border-color]"
    :class="[
      dragging ? 'opacity-40 border-uf-accent' : 'border-uf-border',
      edge === 'top' ? 'before:absolute before:content-[\'\'] before:-top-0.5 before:inset-x-1 before:h-0.5 before:rounded-full before:bg-uf-accent' : '',
      edge === 'bottom' ? 'after:absolute after:content-[\'\'] after:-bottom-0.5 after:inset-x-1 after:h-0.5 after:rounded-full after:bg-uf-accent' : '',
    ]"
  >
    <button
      ref="handle"
      type="button"
      class="shrink-0 cursor-grab text-uf-muted hover:text-uf-text active:cursor-grabbing"
      :aria-label="t('blocks.select.dragOption')"
    >
      <GripVertical :size="13" :stroke-width="1.75" />
    </button>

    <span class="flex-1 min-w-0 truncate text-xs text-uf-text">{{ option.label || t('blocks.select.option') }}</span>
    <span
      v-if="option.selected"
      class="shrink-0 rounded bg-uf-accent/10 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-uf-accent"
    >{{ t('blocks.select.defaultSelected') }}</span>
    <span class="shrink-0 max-w-[40%] truncate font-mono text-xs text-uf-muted">{{ option.value || '—' }}</span>

    <div class="flex items-center shrink-0">
      <Popover :open="editOpen" @update:open="onEditOpenChange">
        <PopoverTrigger :class="iconBtn" :aria-label="t('blocks.select.editOption')">
          <Pencil :size="13" :stroke-width="1.75" />
        </PopoverTrigger>
        <PopoverContent
          class="w-60"
          align="end"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="preventOverlayDismiss"
        >
          <div class="mb-2 text-sm font-semibold text-uf-text">
            {{ t('blocks.select.editOption') }}
          </div>
          <OptionForm
            v-model="editDraft"
            :submit-label="t('common.save')"
            @submit="submitEdit"
            @cancel="editOpen = false"
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        :class="iconBtn"
        :aria-label="t('blocks.select.deleteOption')"
        @click="emit('remove', option.id)"
      >
        <Trash2 :size="13" :stroke-width="1.75" />
      </button>
    </div>
  </div>
</template>
