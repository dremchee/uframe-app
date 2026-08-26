<script setup lang="ts">
import { ChevronRight, Globe, MoreHorizontal } from '@lucide/vue'
import { computed } from 'vue'
import { getBlockPath, resolveSlotFillContext, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core'
import { useCanvasBlockLabels } from '@/vue/composables/canvas/useCanvasBlockLabels'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const { editor } = useEditorContext()
const { t } = useUframeI18n()
const { resolveLabel, resolveIcon } = useCanvasBlockLabels(editor)

interface Crumb {
  id: string | null
  /** Block to select on click — Slot crumbs redirect to their owning instance. */
  selectId: string | null
  label: string
  icon: ReturnType<typeof resolveIcon>
  current: boolean
}

// Keep the root, an ellipsis, and the last few crumbs when the chain is deep
// so the bar never outgrows the canvas (Webflow does the same).
const MAX_VISIBLE = 4

// The document model has no single root block — `blocks` is a flat array of
// top-level blocks. We surface a synthetic "Body" crumb (id `null`) so the
// path always reads from the page root down, like Webflow's Body element.
// Icon matches the Layers tree's Body row (Globe), not a generic square.
const BODY_CRUMB = computed<Crumb>(() => ({ id: null, selectId: null, label: t('canvas.body'), icon: Globe, current: false }))

function toCrumbs(blocks: { id: string, type: string }[]): Crumb[] {
  const doc = editor.effectiveDocument.value
  return blocks.map((block, i, arr) => ({
    id: block.id,
    // Clicking a Slot crumb selects the owning instance — the same behaviour
    // as the slot row in Layers, since the fill itself isn't an editable
    // target outside the component's own edit session.
    selectId: block.type === SYMBOL_SLOT_FILL_BLOCK_TYPE
      ? resolveSlotFillContext(doc.blocks, doc.symbols, block.id)?.instance.id ?? null
      : block.id,
    label: resolveLabel(block.id) ?? block.type,
    icon: resolveIcon(block.id),
    current: i === arr.length - 1,
  }))
}

const crumbs = computed<Crumb[]>(() => {
  const id = editor.selectedBlockId.value
  const scopeId = editor.editScopeRootId.value
  // In-place component editing: draw the path from the component's root block,
  // not from the page Body.
  if (scopeId) {
    const full = getBlockPath(editor.document.value.blocks, id ?? scopeId)
    const start = full.findIndex(b => b.id === scopeId)
    return toCrumbs(start === -1 ? full : full.slice(start))
  }
  if (!id)
    return []
  return [BODY_CRUMB.value, ...toCrumbs(getBlockPath(editor.document.value.blocks, id))]
})

// `null` marks the collapsed gap (rendered as an ellipsis).
const visibleCrumbs = computed<(Crumb | null)[]>(() => {
  const all = crumbs.value
  if (all.length <= MAX_VISIBLE)
    return all
  return [all[0], null, ...all.slice(-(MAX_VISIBLE - 1))]
})

// `null` is the Body crumb — clearing the selection drops to the page root.
function select(id: string | null) {
  editor.selectBlock(id)
}

// Hovering a crumb reuses the tree↔canvas cross-highlight so the matching
// ancestor box lights up on the canvas.
function hover(id: string | null) {
  editor.setHoveredBlock(id, 'tree')
}
</script>

<template>
  <nav
    v-if="visibleCrumbs.length"
    class="absolute bottom-2 left-2 z-20 pointer-events-auto flex items-center gap-0.5 max-w-[calc(100%-1rem)]
      rounded-md border border-uf-border bg-uf-panel/95 px-1.5 py-1 text-[11px] font-medium
      text-uf-muted shadow-pb backdrop-blur-sm overflow-hidden"
    :aria-label="t('canvas.selectedPath')"
    @mouseleave="hover(null)"
  >
    <template v-for="(crumb, i) in visibleCrumbs" :key="crumb ? (crumb.id ?? 'body') : `gap-${i}`">
      <ChevronRight v-if="i > 0" :size="12" :stroke-width="2" class="shrink-0 text-uf-border-strong" />
      <span
        v-if="!crumb"
        class="flex items-center px-1 text-uf-border-strong"
        aria-hidden="true"
      >
        <MoreHorizontal :size="14" :stroke-width="2" />
      </span>
      <button
        v-else
        type="button"
        class="inline-flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 max-w-40
          transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
        :class="crumb.current ? 'bg-uf-accent/15 text-uf-accent' : ''"
        :aria-current="crumb.current ? 'true' : undefined"
        @click="select(crumb.selectId)"
        @mouseenter="hover(crumb.selectId)"
      >
        <component :is="crumb.icon" v-if="crumb.icon" :size="12" :stroke-width="2" class="shrink-0 opacity-90" />
        <span class="truncate">{{ crumb.label }}</span>
      </button>
    </template>
  </nav>
</template>
