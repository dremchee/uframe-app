<script setup lang="ts">
import type { CanvasDropIndicator } from '@/vue/composables/canvas/useCanvasDropOverlay'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Component as ComponentIcon, GripVertical, Plus } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, h, nextTick, render, shallowRef, useTemplateRef, watch } from 'vue'
import { Alert, AlertTitle, Button, Input, Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { findBlock, findBlockParentId, isDescendantOf } from '@/core'
import CanvasBreadcrumbs from '@/vue/components/CanvasBreadcrumbs.vue'
import CanvasFrameDocument from '@/vue/components/CanvasFrameDocument.vue'
import { useCanvasBlockLabels } from '@/vue/composables/canvas/useCanvasBlockLabels'
import { useCanvasContextBridge } from '@/vue/composables/canvas/useCanvasContextBridge'
import { useCanvasDropOverlay } from '@/vue/composables/canvas/useCanvasDropOverlay'
import { useCanvasFrame } from '@/vue/composables/canvas/useCanvasFrame'
import { useCanvasGrid } from '@/vue/composables/canvas/useCanvasGrid'
import { useCanvasInteractions } from '@/vue/composables/canvas/useCanvasInteractions'
import { useCanvasOverlayPresentation } from '@/vue/composables/canvas/useCanvasOverlayPresentation'
import { useCanvasOverlays } from '@/vue/composables/canvas/useCanvasOverlays'
import { TREE_DRAG_TYPE } from '@/vue/composables/dnd/useTreeNodeDnd'
import { useIframeFonts } from '@/vue/composables/fonts/useIframeFonts'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { localizedBlockCategory, localizedBlockLabel } from '@/vue/utils/block-label'

const { editor, features, dataContext, pluginSlots, canvas, untrustedEmbeds } = useEditorContext()
const i18n = useUframeI18n()
const { t } = i18n

const frameRef = useTemplateRef<HTMLIFrameElement>('frameRef')
const overlayRef = useTemplateRef<HTMLElement>('overlayRef')
const canvasPaneRef = useTemplateRef<HTMLElement>('canvasPaneRef')
const selectionHandleRef = useTemplateRef<HTMLElement>('selectionHandleRef')
const { iframeDoc, iframeWin, renderFrame } = useCanvasFrame({
  frame: frameRef,
  renderDocument(mountElement) {
    render(h(CanvasFrameDocument, {
      document: editor.effectiveDocument.value,
      registry: editor.registry.value,
      editable: true,
      ownerDocument: mountElement.ownerDocument,
      editScopeRootId: editor.editScopeRootId.value,
      dataContext: dataContext.value,
      assetPreviews: editor.assetPreviews.value,
      untrustedEmbeds,
      slotFallbackLabel: (name: string) => t('canvas.slotFallback', { name }),
      unknownBlockLabel: (type: string) => t('canvas.unknownBlock', { type }),
      i18n,
    }), mountElement)
  },
  recomputeOverlays: () => overlays.recomputeAll(),
})

// Web fonts: keep the iframe's <link> in step with the registered fonts.
useIframeFonts(iframeDoc, editor)

// `document` / `registry` are shallowRefs reassigned on every commit, so a
// plain reference watch fires for each edit — no `deep` traversal needed.
// Selection no longer participates here: it's painted by the overlay in the
// main window, so changing the selected id doesn't need to re-render the
// iframe tree. Do NOT key this on `document.updatedAt`: that string has only
// millisecond resolution, and a single edit can emit several commits within
// one millisecond, so the final render would be silently dropped.
watch(() => [editor.effectiveDocument.value, editor.registry.value, editor.editScopeRootId.value, dataContext.value, editor.assetPreviews.value], renderFrame)

// Switching pages swaps the document but reuses the same iframe, so its window
// keeps the previous page's scroll offset and the new page opens pre-scrolled.
// Reset to the top-left once the new content has rendered (the document watch
// above renders synchronously in this same flush, so nextTick lands after it).
watch(() => editor.activePageId.value, () => {
  nextTick(() => iframeWin.value?.scrollTo({ left: 0, top: 0 }))
})

// The overlay's interactive bits (gap grips / sensors, track handles, the
// selection drag handle) are pointer-events-auto, so a wheel over them is
// captured by the main window and never reaches the iframe — the canvas can't
// scroll. Forward the scroll to the iframe. The listener sits on the overlay,
// which catches wheel bubbling up from those children even though it is itself
// pointer-events-none (a wheel over an empty overlay area hits the iframe
// directly and never reaches here, so there's no double scroll).
function onOverlayWheel(event: WheelEvent) {
  const win = iframeWin.value
  if (!win)
    return
  event.preventDefault()
  win.scrollBy({ left: event.deltaX, top: event.deltaY })
}
useEventListener(overlayRef, 'wheel', onOverlayWheel, { passive: false })

// ── DnD (library / tree → canvas) ───────────────────────────────────────────

const { indicator, isDragging } = useCanvasDropOverlay({
  overlay: overlayRef,
  iframe: frameRef,
  isDescendantOf: (ancestorId, descendantId) =>
    isDescendantOf(editor.document.value.blocks, ancestorId, descendantId),
  resolveDropTarget: (hit: CanvasDropIndicator) => {
    const blocks = editor.document.value.blocks
    if (hit.position === 'inside') {
      const block = findBlock(blocks, hit.blockId)
      return { parentId: hit.blockId, index: block?.children?.length ?? 0 }
    }
    const parentId = findBlockParentId(blocks, hit.blockId) ?? null
    const list = parentId === null
      ? blocks
      : (findBlock(blocks, parentId)?.children ?? [])
    const targetIdx = list.findIndex(b => b.id === hit.blockId)
    if (targetIdx < 0)
      return null
    return { parentId, index: hit.position === 'before' ? targetIdx : targetIdx + 1 }
  },
  // Slot targets reuse the same editor actions as the Layers tree.
  onTreeDrop: (sourceId, target) => target.kind === 'slot'
    ? editor.moveBlockIntoInstanceSlot(target.instanceId, target.slotId, sourceId)
    : editor.moveBlockTo(sourceId, target.parentId, target.index),
  onLibraryDrop: (blockType, target) => target.kind === 'slot'
    ? editor.insertBlockIntoInstanceSlot(target.instanceId, target.slotId, blockType)
    : editor.insertBlock(blockType, target.parentId, target.index),
  onLibrarySymbolDrop: (symbolId, target) => target.kind === 'slot'
    ? editor.insertSymbolIntoInstanceSlot(target.instanceId, target.slotId, symbolId)
    : editor.insertSymbolInstance(symbolId, target.parentId, target.index),
})

useCanvasInteractions({
  editor,
  frameRef,
  iframeDoc,
  iframeWin,
  isDragging,
  hotkeysEnabled: () => features.hotkeys,
  onCanvasClick: closeInsertMenu,
})

// ── Overlays (selection / hover / spacing bands) ────────────────────────────

// Two-way hover with the tree. When the canvas is the hover source the value
// is read immediately; when the tree is the source we read the throttled
// mirror so the cross-highlight follows smoothly without lag on our own side.
const hoveredBlockId = computed(() =>
  editor.hoverSource.value === 'canvas' ? editor.hoveredBlockId.value : editor.syncedHoverId.value,
)

const overlays = useCanvasOverlays({
  editor,
  frameRef,
  iframeDoc,
  iframeWin,
  hoveredBlockId,
  isDragging,
})
const { selectionRect, selectionRadius, hoverRect, spacingBox, gridBox, flexBox, editScopeRect, hoveredLabelId } = overlays

useCanvasContextBridge({
  canvas,
  editor,
  paneRef: canvasPaneRef,
  frameRef,
  selectionRect,
  selectionRadius,
  scrollBlockIntoView: overlays.scrollBlockIntoView,
})

// ── Block label / icon for the badges ───────────────────────────────────────

const { selectionForId } = useCanvasBlockLabels(editor)
const selected = selectionForId(editor.selectedBlockId)
const hovered = selectionForId(hoveredLabelId)
const isInsertMenuOpen = shallowRef(false)
const insertQuery = shallowRef('')
const insertableBlocks = computed(() => Object.values(editor.registry.value)
  .filter(block => block.availability !== 'component')
  .sort((a, b) => localizedBlockLabel(a.type, a, t).localeCompare(localizedBlockLabel(b.type, b, t))))
const insertQueryNeedle = computed(() => insertQuery.value.trim().toLocaleLowerCase())
const filteredInsertableBlocks = computed(() => insertableBlocks.value.filter((block) => {
  const needle = insertQueryNeedle.value
  return !needle || localizedBlockLabel(block.type, block, t).toLocaleLowerCase().includes(needle)
}))
const insertableBlockGroups = computed(() => {
  const groups = new Map<string, typeof filteredInsertableBlocks.value>()
  for (const block of filteredInsertableBlocks.value) {
    const category = localizedBlockCategory(block, t)
    groups.set(category, [...(groups.get(category) ?? []), block])
  }
  return [...groups].map(([category, blocks]) => ({ category, blocks }))
})
const filteredSymbols = computed(() => editor.symbols.value.filter(symbol =>
  !insertQueryNeedle.value || symbol.name.toLocaleLowerCase().includes(insertQueryNeedle.value),
))
const hasInsertResults = computed(() => filteredInsertableBlocks.value.length > 0 || filteredSymbols.value.length > 0)

watch(isInsertMenuOpen, (isOpen) => {
  if (!isOpen)
    insertQuery.value = ''
})

watch(() => editor.selectedBlockId.value, () => {
  isInsertMenuOpen.value = false
})

function addBlockAtSelection(type: string) {
  if (editor.addBlock(type))
    isInsertMenuOpen.value = false
}

function addComponentAtSelection(symbolId: string) {
  if (editor.addSymbolInstance(symbolId))
    isInsertMenuOpen.value = false
}

function closeInsertMenuOnFocusOut(event: FocusEvent) {
  const content = event.currentTarget
  const nextTarget = event.relatedTarget
  if (content instanceof HTMLElement && nextTarget instanceof Node && content.contains(nextTarget))
    return
  isInsertMenuOpen.value = false
}

function closeInsertMenu() {
  isInsertMenuOpen.value = false
}

// ── Selection badge as a drag-handle ────────────────────────────────────────

// The selection name badge doubles as a drag handle: dragging it reorders the
// selected block. It emits TREE_DRAG_TYPE so the existing drop overlay
// (hit-test + moveBlockTo) handles it — no DnD inside the iframe, so
// contenteditable text selection is never affected.
watch(selectionHandleRef, (el, _prev, onCleanup) => {
  if (!el)
    return
  const stop = draggable({
    element: el,
    getInitialData: () => ({ [TREE_DRAG_TYPE]: true, blockId: editor.selectedBlockId.value }),
  })
  onCleanup(stop)
})

// ── Grid overlay (track guides + drag-to-resize handles) ────────────────────

const {
  gridGuides,
  gridHandles,
  onGridHandleDown,
  onGridHandleMove,
  onGridHandleUp,
  gapHandles,
  flexGapSensors,
  gapBands,
  gapDrag,
  gapHover,
  onGapHandleDown,
  onGapHandleMove,
  onGapHandleUp,
  onGapHandleEnter,
  onGapHandleLeave,
} = useCanvasGrid({ editor, gridBox, flexBox, isDragging })

const {
  bannerAtBottom,
  bandColor,
  canvasWidthStyle,
  editingSymbol,
  editScrimStyle,
  hoverLabelStyle,
  hoverStyle,
  indicatorClass,
  indicatorStyle,
  isGapContainer,
  isSelectedData,
  isSelectedSymbol,
  selectionLabelStyle,
  selectionStyle,
  spacingBands,
} = useCanvasOverlayPresentation({
  editor,
  frameRef,
  iframeWin,
  indicator,
  selectionRect,
  hoverRect,
  spacingBox,
  gridBox,
  flexBox,
  editScopeRect,
  hoveredLabelId,
})
</script>

<template>
  <section ref="canvasPaneRef" class="flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
    <div
      class="relative flex-1 min-h-0 mx-auto bg-uf-panel overflow-hidden"
      :style="{ width: canvasWidthStyle, backgroundColor: editor.effectiveDocument.value.settings.background }"
    >
      <iframe
        ref="frameRef"
        class="block w-full h-full border-0 bg-transparent"
        :style="{ pointerEvents: isDragging ? 'none' : undefined }"
        :title="t('canvas.pageCanvas')"
      />
      <!-- In-place component editing: a dark island banner stuck over the canvas
           (absolute), bottom-centered, above the dim scrim. -->
      <Alert
        v-if="editingSymbol"
        class="absolute left-1/2 z-20 inline-flex w-auto max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-md border-0 bg-uf-symbol px-3 py-1.5 text-[12px] text-white shadow-lg pointer-events-auto"
        :class="bannerAtBottom ? 'bottom-4' : 'top-4'"
      >
        <ComponentIcon :stroke-width="1.75" class="shrink-0 text-white/90" />
        <AlertTitle class="flex-1 min-w-0 truncate text-white">
          Editing component: {{ editingSymbol.name }}
        </AlertTitle>
        <Button size="sm" variant="secondary" type="button" @click="editor.exitSymbolEdit">
          Done
        </Button>
      </Alert>
      <div
        ref="overlayRef"
        class="absolute inset-0 z-10"
        :class="isDragging ? 'pointer-events-auto' : 'pointer-events-none'"
      >
        <!-- In-place component editing: dark scrim over the whole canvas with a
             clear "island" cut out over the edited component (all sides). -->
        <div
          v-if="editScrimStyle"
          class="absolute pointer-events-none rounded-[2px]"
          :style="{ ...editScrimStyle, boxShadow: '0 0 0 100vmax rgba(2,6,23,0.55)' }"
        />

        <!-- Grid track guides (lines + content outline) for a grid container -->
        <template v-if="gridGuides">
          <div
            class="absolute pointer-events-none border border-dashed border-uf-gap/40 rounded-[1px]"
            :style="gridGuides.outline"
          />
          <div
            v-for="line in gridGuides.lines"
            :key="line.key"
            class="absolute pointer-events-none border-uf-gap/50"
            :class="line.vertical ? 'border-l border-dashed' : 'border-t border-dashed'"
            :style="line.style"
          />
        </template>

        <!-- Gap highlight bands — only while a gap is being dragged -->
        <div
          v-for="band in gapBands"
          :key="band.key"
          class="absolute pointer-events-none bg-uf-gap/20"
          :style="band.style"
        />

        <!-- Drag handles to resize tracks (base layer only): the whole gap area
             between two column/row boundaries, no highlight — just the cursor.
             It also doubles as the gap hint sensor (hovering anywhere in the gap
             reveals the gap grip), without changing the resize gesture. -->
        <div
          v-for="hd in gridHandles"
          :key="hd.key"
          class="absolute z-20 pointer-events-auto"
          :class="hd.axis === 'col' ? 'cursor-col-resize' : 'cursor-row-resize'"
          :style="hd.style"
          @pointerdown.stop="onGridHandleDown($event, hd.axis, hd.index)"
          @pointermove="onGridHandleMove"
          @pointerup="onGridHandleUp"
          @lostpointercapture="onGridHandleUp"
          @mouseenter="onGapHandleEnter(hd.axis)"
          @mouseleave="onGapHandleLeave"
        />

        <!-- Flex gap hint sensors: transparent full-gap rects that reveal the
             grip on hover (flex has no track handles to double as the sensor).
             Hover-only — the grip still owns the drag. -->
        <div
          v-for="s in flexGapSensors"
          :key="s.id"
          class="absolute z-20 pointer-events-auto"
          :style="s.style"
          @mouseenter="onGapHandleEnter(s.axis)"
          @mouseleave="onGapHandleLeave"
        />

        <!-- Gap grips: drag the band between tracks to resize the gap. The drag
             zone stays small; the pill is the gap hint and shows whenever the
             cursor is anywhere over this axis's gap (set from here or the track
             handle), or while dragging. -->
        <div
          v-for="gp in gapHandles"
          :key="gp.id"
          class="absolute z-30 flex items-center justify-center pointer-events-auto -translate-x-1/2 -translate-y-1/2"
          :class="gp.axis === 'col' ? 'w-4 h-7 cursor-col-resize' : 'h-4 w-7 cursor-row-resize'"
          :style="gp.style"
          @pointerdown.stop="onGapHandleDown($event, gp)"
          @pointermove="onGapHandleMove"
          @pointerup="onGapHandleUp"
          @lostpointercapture="onGapHandleUp"
          @mouseenter="onGapHandleEnter(gp.axis)"
          @mouseleave="onGapHandleLeave"
        >
          <div
            class="rounded-full bg-uf-gap opacity-60 transition-opacity"
            :class="[
              gp.axis === 'col' ? 'w-0.5 h-6' : 'h-0.5 w-6',
              (gapHover === gp.axis || (gapDrag && gapDrag.axis === gp.axis)) && 'opacity-100!',
            ]"
          />
        </div>

        <template v-if="!isDragging">
          <div
            v-for="band in spacingBands"
            :key="band.key"
            class="absolute pointer-events-none flex items-center justify-center"
            :style="{ ...band.style, backgroundColor: bandColor(band) }"
          >
            <span
              v-if="band.value >= 1 && editor.spacingOverlay.value?.group === band.group"
              class="px-1 rounded-[3px] bg-primary/90 text-primary-foreground text-[10px] leading-tight tabular-nums backdrop-blur-[2px]"
            >{{ Math.round(band.value) }}</span>
          </div>
        </template>
        <div
          v-if="hoverRect && !isDragging"
          class="absolute z-20 pointer-events-none"
          :style="hoverStyle ?? undefined"
        />
        <div
          v-if="hoverRect && hovered.label.value && !isDragging"
          class="absolute z-20 pointer-events-none inline-flex items-center gap-1 h-5 px-1.5 rounded-[2px] bg-uf-muted text-white text-[11px] font-semibold leading-none whitespace-nowrap"
          :style="hoverLabelStyle ?? undefined"
        >
          <component :is="hovered.icon.value" v-if="hovered.icon.value" :size="12" :stroke-width="2" class="shrink-0 opacity-90" />
          {{ hovered.label.value }}
        </div>
        <div
          v-if="selectionRect && !isDragging && !canvas.busy.value"
          class="absolute pointer-events-none"
          :style="selectionStyle ?? undefined"
        />
        <!-- Plugin-contributed in-canvas layers, in canvas coordinate space
             (e.g. the AI "generating" ring over the target block). -->
        <component :is="c" v-for="(c, i) in pluginSlots.canvasLayers" :key="i" />
        <div
          v-if="selectionRect && selected.label.value"
          class="absolute pointer-events-auto inline-flex items-center gap-1"
          :style="selectionLabelStyle ?? undefined"
        >
          <div
            ref="selectionHandleRef"
            class="inline-flex items-center gap-1 h-5 pl-0.5 pr-1.5 rounded-[2px] text-[11px] font-semibold leading-none whitespace-nowrap cursor-grab active:cursor-grabbing select-none"
            :class="isSelectedSymbol ? 'bg-uf-symbol text-white' : isSelectedData ? 'bg-uf-data text-white' : isGapContainer ? 'bg-uf-gap text-white' : 'bg-uf-accent text-uf-accent-foreground'"
            :title="t('canvas.dragToMove')"
          >
            <GripVertical :size="12" :stroke-width="2" class="shrink-0 -mr-0.5 opacity-70" aria-hidden="true" />
            <component :is="selected.icon.value" v-if="selected.icon.value" :size="12" :stroke-width="2" class="shrink-0 opacity-90" />
            {{ selected.label.value }}
          </div>
          <Popover v-model:open="isInsertMenuOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="inline-flex size-5 shrink-0 items-center justify-center rounded-[2px] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                :class="isSelectedSymbol ? 'bg-uf-symbol text-white' : isSelectedData ? 'bg-uf-data text-white' : isGapContainer ? 'bg-uf-gap text-white' : 'bg-uf-accent text-uf-accent-foreground'"
                :aria-label="t('common.add')"
                @pointerdown.stop
                @click.stop
              >
                <Plus :size="12" :stroke-width="2.25" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              v-if="isInsertMenuOpen"
              :title="t('common.add')"
              side="bottom"
              align="start"
              class="w-56"
              body-class="p-0"
              @focusout="closeInsertMenuOnFocusOut"
            >
              <div class="p-1.5">
                <Input
                  v-model="insertQuery"
                  autofocus
                  class="h-7 text-xs"
                  :placeholder="t('library.search')"
                  @pointerdown.stop
                />
              </div>
              <div v-if="hasInsertResults" class="max-h-60 overflow-y-auto">
                <section
                  v-for="group in insertableBlockGroups"
                  :key="group.category"
                  class="flex flex-col gap-0.5 px-1.5"
                  :class="[group !== insertableBlockGroups[0] && 'mt-1.5 border-t border-uf-border pt-1.5']"
                >
                  <p class="px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
                    {{ group.category }}
                  </p>
                  <button
                    v-for="block in group.blocks"
                    :key="block.type"
                    type="button"
                    class="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs text-uf-text transition-colors hover:bg-uf-panel-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent"
                    @click="addBlockAtSelection(block.type)"
                  >
                    <component :is="block.icon" v-if="block.icon" :size="13" :stroke-width="1.75" class="mr-1.5 shrink-0 text-uf-muted" />
                    <ComponentIcon v-else :size="13" :stroke-width="1.75" class="mr-1.5 shrink-0 text-uf-muted" />
                    {{ localizedBlockLabel(block.type, block, t) }}
                  </button>
                </section>
                <section v-if="filteredSymbols.length" class="flex flex-col gap-0.5 px-1.5" :class="[insertableBlockGroups.length && 'mt-1.5 border-t border-uf-border pt-1.5']">
                  <p class="px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-uf-muted">
                    {{ t('properties.component') }}
                  </p>
                  <button
                    v-for="symbol in filteredSymbols"
                    :key="symbol.id"
                    type="button"
                    class="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-xs text-uf-text transition-colors hover:bg-uf-panel-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent"
                    @click="addComponentAtSelection(symbol.id)"
                  >
                    <ComponentIcon :size="13" :stroke-width="1.75" class="shrink-0 text-uf-symbol" />
                    <span class="min-w-0 truncate">{{ symbol.name }}</span>
                  </button>
                </section>
              </div>
              <p v-else class="px-2 pb-4 text-center text-xs text-uf-muted">
                {{ t('library.noMatches') }}
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div
          v-if="indicator"
          class="absolute pointer-events-none transition-all duration-75"
          :class="indicatorClass"
          :style="indicatorStyle ?? undefined"
        />
      </div>
      <CanvasBreadcrumbs v-if="!isDragging && !editor.isPreviewMode.value" />
    </div>
  </section>
</template>
