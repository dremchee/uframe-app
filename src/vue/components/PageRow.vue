<script setup lang="ts">
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { PageDocument } from '@/core'
import { File, Trash2 } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import { cn } from '@/lib/utils'
import { usePageRowDnd } from '@/vue/composables/dnd/usePagesDnd'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  page: PageDocument
  active: boolean
  canDelete: boolean
  depth: number
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'rename', title: string): void
  (e: 'remove'): void
  (e: 'drop', payload: { draggedId: string, edge: Edge | null }): void
}>()

const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const edge = ref<Edge | null>(null)
const dragging = ref(false)

const pageId = computed(() => props.page.id)

usePageRowDnd({
  el,
  pageId,
  setEdge: e => (edge.value = e),
  setDragging: d => (dragging.value = d),
  onDrop: payload => emit('drop', payload),
})

// Same indentation scheme as the block tree (PageTreeRow): 12px per level plus
// VSCode-style vertical guides for each ancestor level.
const paddingLeft = computed(() => `calc(0.5rem + ${props.depth} * 12px)`)
const guideStyles = computed(() => {
  const out: { left: string }[] = []
  for (let i = 1; i < props.depth; i++)
    out.push({ left: `calc(0.5rem + ${i} * 12px + 7px)` })
  return out
})

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

async function startRename() {
  editing.value = true
  draft.value = props.page.title
  await nextTick()
  inputRef.value?.select()
}

function commitRename() {
  if (editing.value) {
    const title = draft.value.trim()
    if (title && title !== props.page.title)
      emit('rename', title)
  }
  editing.value = false
}

const row = 'group relative flex items-center gap-1 w-full min-h-8 pr-2 py-1 rounded-md cursor-pointer text-uf-text transition-colors hover:bg-uf-panel-muted'
const rowActive = 'bg-uf-accent/12 text-uf-accent-strong hover:bg-uf-accent/12'
</script>

<template>
  <div
    ref="el"
    :class="cn(row, active && rowActive, dragging && 'opacity-50')"
    :style="{ paddingLeft }"
    @click="emit('select')"
    @dblclick="startRename"
  >
    <span
      v-for="(guide, i) in guideStyles"
      :key="i"
      class="absolute top-0 bottom-0 w-px bg-uf-border pointer-events-none"
      :style="guide"
      aria-hidden="true"
    />
    <!-- Drop-edge indicators -->
    <div v-if="edge === 'top'" class="absolute -top-px left-1 right-1 h-0.5 rounded-full bg-uf-accent" />
    <div v-if="edge === 'bottom'" class="absolute -bottom-px left-1 right-1 h-0.5 rounded-full bg-uf-accent" />

    <!-- Empty chevron column (pages are leaves) so icons align with group folders. -->
    <span class="flex-none w-3.5" aria-hidden="true" />
    <File :size="13" :stroke-width="1.75" class="flex-none text-uf-muted" />

    <input
      v-if="editing"
      ref="inputRef"
      v-model="draft"
      class="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] font-inherit"
      @click.stop
      @keydown.enter.prevent="commitRename"
      @keydown.esc.prevent="editing = false"
      @blur="commitRename"
    >
    <template v-else>
      <span class="flex-1 min-w-0 truncate text-[13px]">{{ page.title || t('pages.untitled') }}</span>
      <button
        v-if="canDelete"
        type="button"
        class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-uf-muted cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 hover:bg-uf-panel-muted hover:text-uf-text"
        :aria-label="t('pages.deleteAria')"
        @click.stop="emit('remove')"
      >
        <Trash2 :size="14" :stroke-width="1.75" />
      </button>
    </template>
  </div>
</template>
