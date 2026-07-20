<script setup lang="ts">
import { ChevronRight, Folder, Plus, Trash2 } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import { cn } from '@/lib/utils'
import { useGroupNodeDnd } from '@/vue/composables/dnd/usePagesDnd'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  path: string
  name: string
  collapsed: boolean
  depth: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'rename', name: string): void
  (e: 'add'): void
  (e: 'delete'): void
  (e: 'dropPage', draggedId: string): void
  (e: 'dropGroup', draggedPath: string): void
}>()

const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const over = ref(false)
const dragging = ref(false)
const groupPath = computed(() => props.path)

useGroupNodeDnd({
  el,
  groupPath,
  setOver: v => (over.value = v),
  setDragging: d => (dragging.value = d),
  onDropPage: id => emit('dropPage', id),
  onDropGroup: p => emit('dropGroup', p),
})

// Indentation matches the block tree (PageTreeRow): 12px per level + guides.
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
  draft.value = props.name
  await nextTick()
  inputRef.value?.select()
}

function commitRename() {
  if (editing.value) {
    const name = draft.value.trim()
    if (name && name !== props.name)
      emit('rename', name)
  }
  editing.value = false
}

const head = computed(() =>
  cn(
    'group/h relative flex items-center gap-1 min-h-8 pr-2 py-1 rounded-md text-uf-text cursor-pointer transition-colors hover:bg-uf-panel-muted',
    over.value && 'bg-uf-accent/10 ring-1 ring-uf-accent/40',
    dragging.value && 'opacity-50',
  ),
)
</script>

<template>
  <div ref="el" :class="head" :style="{ paddingLeft }">
    <span
      v-for="(guide, i) in guideStyles"
      :key="i"
      class="absolute top-0 bottom-0 w-px bg-uf-border pointer-events-none"
      :style="guide"
      aria-hidden="true"
    />
    <button
      type="button"
      class="flex-none inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-transparent text-uf-muted cursor-pointer transition-transform hover:bg-black/6 hover:text-uf-text"
      :class="!collapsed && 'rotate-90'"
      :aria-label="collapsed ? t('pages.expandGroup') : t('pages.collapseGroup')"
      @click.stop="emit('toggle')"
    >
      <ChevronRight :size="12" :stroke-width="2" />
    </button>
    <Folder :size="13" :stroke-width="1.75" class="flex-none text-uf-muted" />

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
      <span class="flex-1 min-w-0 truncate text-[13px]" @dblclick="startRename">
        {{ name || t('pages.unnamedGroup') }}
      </span>
      <button
        type="button"
        class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-uf-muted cursor-pointer opacity-0 transition-opacity group-hover/h:opacity-100 hover:text-uf-text"
        :aria-label="t('pages.addToGroup')"
        @click.stop="emit('add')"
      >
        <Plus :size="13" :stroke-width="2" />
      </button>
      <button
        type="button"
        class="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-transparent text-uf-muted cursor-pointer opacity-0 transition-opacity group-hover/h:opacity-100 hover:text-uf-text"
        :aria-label="t('pages.deleteGroup')"
        @click.stop="emit('delete')"
      >
        <Trash2 :size="13" :stroke-width="1.75" />
      </button>
    </template>
  </div>
</template>
