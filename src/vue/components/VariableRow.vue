<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { CssVariable } from '@/core'
import type { VariableDraft } from '@/vue/components/VariableForm.vue'
import { GripVertical, Pencil, Trash2 } from '@lucide/vue'
import { ref, toRef } from 'vue'
import { IconButton, Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import VariableForm from '@/vue/components/VariableForm.vue'
import { useRowReorderDnd } from '@/vue/composables/dnd/useRowReorderDnd'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  variable: CssVariable
  index: number
}>()

const emit = defineEmits<{
  update: [index: number, patch: Partial<CssVariable>]
  remove: [index: number]
  reorder: [from: number, to: number]
}>()

const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)

// Open the edit form flush to the panel edge, on the canvas side.
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(el)

// ── Edit form (prefilled popover) ───────────────────────────────────────────
const editOpen = ref(false)
const editDraft = ref<VariableDraft>({ name: '', val: '', type: 'color' })

function onEditOpenChange(open: boolean) {
  if (open)
    editDraft.value = { name: props.variable.name, val: props.variable.value, type: props.variable.type }
  editOpen.value = open
}

function submitEdit() {
  emit('update', props.index, {
    name: editDraft.value.name,
    value: editDraft.value.val,
    type: editDraft.value.type,
  })
  editOpen.value = false
}

useRowReorderDnd({
  dragType: 'application/x-uf-variable',
  el,
  handle,
  index: toRef(props, 'index'),
  onReorder: (from, to) => emit('reorder', from, to),
  setEdge: value => (edge.value = value),
  setDragging: value => (dragging.value = value),
})
</script>

<template>
  <div
    ref="el"
    class="group relative flex shrink-0 items-center gap-1.5 rounded-md border bg-uf-panel shadow-xs pl-1.5 pr-1 h-9 transition-[opacity,border-color]"
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
      :aria-label="t('variables.dragAria')"
    >
      <GripVertical :size="13" :stroke-width="1.75" />
    </button>

    <span
      v-if="variable.type === 'color'"
      class="shrink-0 size-4 rounded-sm border border-input"
      :style="{ backgroundColor: variable.value || 'transparent' }"
    />
    <!-- The css custom property (--key) usually mirrors the name — it lives
         in the hover title instead of duplicating the label in the row. -->
    <span class="shrink-0 max-w-[40%] truncate text-xs text-uf-text" :title="`--${variable.key}`">{{ variable.name }}</span>
    <span class="flex-1 min-w-0 truncate text-right text-xs text-uf-muted">{{ variable.value || '—' }}</span>
    <span class="shrink-0 text-[10px] uppercase tracking-wide text-uf-muted">{{ variable.type }}</span>

    <div class="flex items-center shrink-0">
      <Popover :open="editOpen" @update:open="onEditOpenChange">
        <PopoverTrigger as-child>
          <IconButton size="sm" :aria-label="t('variables.editAria')">
            <Pencil :size="13" :stroke-width="1.75" />
          </IconButton>
        </PopoverTrigger>
        <PopoverContent
          class="w-64"
          :side="popoverSide"
          :reference="popoverReference"
          align="start"
          :title="t('variables.editTitle')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(e: Event) => e.preventDefault()"
        >
          <VariableForm
            v-model="editDraft"
            :submit-label="t('common.save')"
            @submit="submitEdit"
            @cancel="editOpen = false"
          />
        </PopoverContent>
      </Popover>

      <IconButton size="sm" :aria-label="t('variables.deleteAria')" @click="emit('remove', index)">
        <Trash2 :size="13" :stroke-width="1.75" />
      </IconButton>
    </div>
  </div>
</template>
