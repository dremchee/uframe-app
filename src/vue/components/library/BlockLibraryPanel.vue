<script setup lang="ts">
import type { BlockDefinition, BlockPreset } from '@/core'
import { Search, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Input, ScrollArea } from '@/components/ui'
import BlockLibraryCard from '@/vue/components/library/BlockLibraryCard.vue'
import { useUframeI18n } from '@/vue/i18n'
import { localizedBlockCategory, localizedBlockDescription, localizedBlockLabel, localizedPresetDescription, localizedPresetLabel } from '@/vue/utils/block-label'

const props = defineProps<{
  blocks: BlockDefinition[]
}>()

const emit = defineEmits<{
  add: [type: string, presetId?: string]
}>()

// One card per entry: the plain block, then each of its presets. Presets are
// alternative starting shapes of the same type (see `BlockPreset`), so they
// share the block's category and sit right after its card.
interface LibraryEntry {
  key: string
  block: BlockDefinition
  preset?: BlockPreset
  label: string
  description: string
  category: string
}

const { t } = useUframeI18n()

// Live search text (top input) + committed filter tags (chips below). Tags
// broaden the result (OR — a block matching ANY tag is kept); the live query
// further narrows on top (AND). Matched against label / description / type /
// category.
const query = ref('')
const terms = ref<string[]>([])

// Autocomplete UI state.
const focused = ref(false)
const highlight = ref(-1)

const tagNeedles = computed<string[]>(() => terms.value.map(t => t.trim().toLowerCase()).filter(Boolean))
const queryNeedle = computed<string>(() => query.value.trim().toLowerCase())

const entries = computed<LibraryEntry[]>(() => {
  const out: LibraryEntry[] = []
  for (const block of props.blocks) {
    // Component-only blocks (currently Slot) are created from Layers while
    // editing a master, never from the page's general Add panel.
    if (block.availability === 'component')
      continue
    const category = localizedBlockCategory(block, t)
    out.push({
      key: block.type,
      block,
      label: localizedBlockLabel(block.type, block, t),
      description: localizedBlockDescription(block.type, block, t) ?? '',
      category,
    })
    for (const preset of block.presets ?? []) {
      out.push({
        key: `${block.type}#${preset.id}`,
        block,
        preset,
        label: localizedPresetLabel(preset, t),
        description: localizedPresetDescription(preset, t) ?? '',
        category,
      })
    }
  }
  return out
})

const sections = computed<Array<{ category: string, entries: LibraryEntry[] }>>(() => {
  const tags = tagNeedles.value
  const q = queryNeedle.value
  const map = new Map<string, LibraryEntry[]>()
  for (const entry of entries.value) {
    const haystack = `${entry.label} ${entry.description} ${entry.block.type} ${entry.category}`.toLowerCase()
    if (tags.length && !tags.some(n => haystack.includes(n)))
      continue
    if (q && !haystack.includes(q))
      continue
    const list = map.get(entry.category)
    if (list)
      list.push(entry)
    else map.set(entry.category, [entry])
  }
  return Array.from(map, ([category, list]) => ({ category, entries: list }))
})

// Suggestion pool: distinct block / preset labels + category names. Selecting
// one (or pressing Enter on free text) commits it as a filter tag.
const suggestionPool = computed<string[]>(() => {
  const map = new Map<string, string>()
  for (const entry of entries.value) {
    if (entry.label)
      map.set(entry.label.toLowerCase(), entry.label)
    map.set(entry.category.toLowerCase(), entry.category)
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b))
})

const matches = computed<string[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q)
    return []
  const taken = new Set(terms.value.map(t => t.toLowerCase()))
  return suggestionPool.value
    .filter((s) => {
      const v = s.toLowerCase()
      return !taken.has(v) && v.includes(q)
    })
    .slice(0, 8)
})

const showSuggest = computed(() => focused.value && matches.value.length > 0)

// Reset the keyboard highlight whenever the candidate list changes.
watch(query, () => {
  highlight.value = -1
})

function addTerm(value: string) {
  const v = value.trim()
  if (!v)
    return
  if (!terms.value.some(t => t.toLowerCase() === v.toLowerCase()))
    terms.value = [...terms.value, v]
  query.value = ''
  highlight.value = -1
}

function removeTerm(value: string) {
  terms.value = terms.value.filter(t => t !== value)
}

function onKeydown(event: KeyboardEvent) {
  const list = matches.value
  switch (event.key) {
    case 'ArrowDown':
      if (list.length) {
        event.preventDefault()
        highlight.value = (highlight.value + 1) % list.length
      }
      break
    case 'ArrowUp':
      if (list.length) {
        event.preventDefault()
        highlight.value = (highlight.value - 1 + list.length) % list.length
      }
      break
    case 'Enter': {
      const pick = highlight.value >= 0 ? list[highlight.value] : query.value
      if (pick.trim()) {
        event.preventDefault()
        addTerm(pick)
      }
      break
    }
    case 'Escape':
      query.value = ''
      highlight.value = -1
      break
    case 'Backspace':
      if (!query.value && terms.value.length)
        terms.value = terms.value.slice(0, -1)
      break
  }
}
</script>

<template>
  <section class="flex flex-col min-h-0 h-full overflow-hidden">
    <div class="shrink-0 flex flex-col gap-2 p-3 pb-2">
      <div class="relative">
        <Search :size="14" :stroke-width="2" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-uf-muted" />
        <Input
          v-model="query"
          :placeholder="t('library.search')"
          class="h-8 pl-8"
          @focus="focused = true"
          @blur="focused = false"
          @keydown="onKeydown"
        />

        <ul
          v-if="showSuggest"
          class="uf-overlay absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          <li
            v-for="(s, i) in matches"
            :key="s"
            class="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-[13px] transition-colors" :class="[
              i === highlight ? 'bg-uf-accent/10 text-uf-accent' : 'text-uf-text hover:bg-uf-panel-muted',
            ]"
            @mousedown.prevent="addTerm(s)"
            @mouseenter="highlight = i"
          >
            {{ s }}
          </li>
        </ul>
      </div>

      <div v-if="terms.length" class="flex flex-wrap gap-1">
        <span
          v-for="term in terms"
          :key="term"
          class="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full border border-uf-accent bg-uf-accent/10 text-uf-accent text-[11px] font-medium"
        >
          {{ term }}
          <button
            type="button"
            class="inline-flex size-4 items-center justify-center rounded-full text-uf-accent/70 hover:text-uf-accent hover:bg-uf-accent/20 transition-colors"
            @click="removeTerm(term)"
          >
            <X :size="11" :stroke-width="2.5" />
          </button>
        </span>
      </div>
    </div>

    <ScrollArea class="flex-1 min-h-0 flex flex-col p-3 pt-1 overflow-auto">
      <div v-for="(section, i) in sections" :key="section.category" :class="i > 0 && 'mt-4'">
        <div class="mb-1 px-1 text-[10px] uppercase tracking-wider font-semibold text-uf-muted">
          {{ section.category }}
        </div>
        <div class="flex flex-col gap-1.5">
          <BlockLibraryCard
            v-for="entry in section.entries"
            :key="entry.key"
            :block="entry.block"
            :preset="entry.preset"
            @add="(type, presetId) => emit('add', type, presetId)"
          />
        </div>
      </div>

      <p v-if="!sections.length" class="px-2 py-6 text-center text-[12px] text-uf-muted leading-snug">
        {{ t('library.noMatches') }}
      </p>
    </ScrollArea>
  </section>
</template>
