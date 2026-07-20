<script setup lang="ts">
import type { BlockRegistry, PageBlock, ResolveContext, SymbolDefinition } from '@/core'
import { computed } from 'vue'
import {
  blockClassName,
  COMPONENT_SLOT_BLOCK_TYPE,
  styleClassName,
} from '@/core'
import NeutralBlockHost from '@/vue/components/NeutralBlockHost.vue'
import { useCanvasBlockPreview } from '@/vue/composables/canvas/useCanvasBlockPreview'
import { useCanvasSymbolInstance } from '@/vue/composables/canvas/useCanvasSymbolInstance'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  block: PageBlock
  registry: BlockRegistry
  symbols?: Record<string, SymbolDefinition>
  editable?: boolean
  // When false, this block is rendered as part of a symbol instance's
  // master tree — strip data-block-id and click handlers so canvas hit-test
  // and DnD don't reach inside the instance. The outer instance wrapper
  // owns selection. Default true: Vue's Boolean-prop casting would
  // otherwise make omitted = false, silently turning off selection.
  interactive?: boolean
  /** IDs of instance-owned Slot content that stays editable inside a locked master. */
  interactiveBlockIds?: ReadonlySet<string>
  // Symbol IDs currently in the render stack — recursing into one of these
  // would loop forever, so we short-circuit. Phase 1 has no UI to *create*
  // a cycle, but the guard keeps the renderer safe if a malformed document
  // is loaded.
  ancestorSymbols?: ReadonlySet<string>
  // In-place symbol editing: id of the editable subtree root spliced into the
  // page. When set, only that subtree is interactive; everything else renders
  // dimmed + non-interactive. `null` → no in-place edit (normal full page).
  editScopeRootId?: string | null
  // True once this block is at/inside the edit scope (or when not editing).
  inEditScope?: boolean
  // Preview-only data scope: the current `item` record for binding resolution.
  // Threaded down the tree; a Data List/Item sets a new one for its
  // children from the host's sample data. Never mutates the document.
  scope?: Record<string, unknown>
  // Host sample data (uframe:setDataContext). Threaded by prop, NOT inject:
  // the canvas mounts via a standalone `render()` with no app context, so an
  // injected provider never reaches here. Drives bound-prop previews and the
  // Data List's repeated preview rows.
  dataContext?: ResolveContext
  // Per-row instance suffix appended to `data-block-id` (e.g. `~1`) for Data
  // List preview copies, so each rendered copy is a distinct hit/overlay target
  // while mapping back to the one template block id. Empty for normal blocks.
  instanceSuffix?: string
  // Resolved preview URLs for picked media assets, keyed by assetKey(ref). Lets
  // a block with an `asset` show its chosen image on the canvas.
  assetPreviews?: Record<string, string>
  // Id of the nearest droppable component instance (an instance that is a real,
  // interactive document block). Slot blocks in its materialized tree tag their
  // wrapper with data-slot-instance-id/data-slot-id so canvas DnD can target
  // "drop into this instance's Slot". Unset inside non-interactive nested
  // masters — their fills live in the definition, not on the page.
  slotDropInstanceId?: string
  circularComponentLabel?: string
  missingComponentLabel?: string
  unknownBlockLabel?: (type: string) => string
  slotFallbackLabel?: (name: string) => string
  selectOptionFallbackLabel?: string
}>(), {
  interactive: true,
  inEditScope: true,
  instanceSuffix: '',
})

const { t } = useUframeI18n()

const { displayProps, dataListRows, childScope } = useCanvasBlockPreview({
  block: () => props.block,
  scope: () => props.scope,
  dataContext: () => props.dataContext,
  assetPreviews: () => props.assetPreviews,
})

const {
  isCircular,
  isSymbolInstance,
  materializedRoot,
  materializedSymbol,
  nestedAncestorSymbols,
  symbol,
} = useCanvasSymbolInstance({
  block: () => props.block,
  symbols: () => props.symbols,
  ancestorSymbols: () => props.ancestorSymbols,
  scope: () => props.scope,
  dataContext: () => props.dataContext,
})

// In-place edit scoping. Out of edit mode (`editScopeRootId == null`) nothing
// changes: everything is in scope, interactive, and undimmed.
const isScopeRoot = computed(() => props.editScopeRootId != null && props.block.id === props.editScopeRootId)
const selfInScope = computed(() => props.inEditScope || isScopeRoot.value)
// Out-of-scope blocks lose interactivity exactly like symbol-instance masters
// do — no data-block-id → hit-test / overlays / DnD skip them for free.
const effectiveInteractive = computed(() =>
  (props.interactive || !!props.interactiveBlockIds?.has(props.block.id))
  && (props.editScopeRootId == null || selfInScope.value),
)

const definition = computed(() =>
  isSymbolInstance.value ? undefined : props.registry[props.block.type],
)
const renderComponent = computed(() => definition.value?.renderComponent)
// Framework-neutral blocks render via a custom element (`element`) instead of a
// Vue component — hosted by NeutralBlockHost. Vue `renderComponent` wins when both
// are present (first-party path).
const elementTag = computed(() => (renderComponent.value ? undefined : definition.value?.element))
const blockClass = computed(() => {
  const classes: string[] = []
  for (const name of props.block.classes ?? [])
    classes.push(styleClassName(name))
  // The machine class exists solely as the selector for block-local styles
  // (insert-time defaults, styles not yet extracted into a named class) —
  // same rule as the export. Reactivity re-adds it the moment local styles
  // appear, so normalized blocks stay clean in the canvas DOM too.
  if (props.block.style && Object.keys(props.block.style).length > 0)
    classes.push(blockClassName(props.block.id))
  return classes
})
const hasChildren = computed(() => !!props.block.children?.length)
// The empty "Drop blocks inside" placeholder only exists to keep a collapsed,
// style-less container visible + droppable. Once the author gives it a box of
// its own (explicit size or spacing) it's already visible, so the placeholder
// is noise — suppress it.
const BOX_KEYS = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const
const hasOwnBox = computed(() => {
  const s = props.block.style as Record<string, unknown> | undefined
  return !!s && BOX_KEYS.some(k => s[k] != null && s[k] !== '')
})
const acceptsChildren = computed(() =>
  isSymbolInstance.value ? false : !!definition.value?.acceptsChildren,
)

// A Slot rendered inside a droppable instance advertises itself to the canvas
// DnD hit-test via data attributes (it has no data-block-id of its own).
const slotDropTarget = computed(() =>
  props.block.type === COMPONENT_SLOT_BLOCK_TYPE && props.slotDropInstanceId
    ? { instanceId: props.slotDropInstanceId, slotId: props.block.id }
    : undefined,
)

// Selection is handled centrally in CanvasViewport via a document-level
// click listener that walks closest('[data-block-id]'). No per-block @click
// here — that would lose the inner-content case (Embed, Link Block, form
// fields, ...) where `pointer-events: none` keeps clicks from reaching the
// `display: contents` wrapper.
</script>

<template>
  <!-- Hidden blocks collapse via an inline display:none on the wrapper — the
       inline style wins over the wrapper's own display:contents rule. -->
  <div
    class="uf-canvas-block"
    :class="{
      'uf-canvas-block--editable': editable && effectiveInteractive,
      'uf-canvas-block--symbol-instance': isSymbolInstance,
    }"
    :style="block.hidden ? { display: 'none' } : undefined"
    :data-block-id="effectiveInteractive ? block.id + instanceSuffix : undefined"
    :data-accepts-children="effectiveInteractive ? (acceptsChildren ? 'true' : 'false') : undefined"
    :data-slot-instance-id="slotDropTarget?.instanceId"
    :data-slot-id="slotDropTarget?.slotId"
  >
    <template v-if="isSymbolInstance">
      <CanvasBlockRenderer
        v-if="symbol && materializedRoot"
        :block="materializedRoot"
        :registry="registry"
        :symbols="symbols"
        :editable="editable"
        :interactive="false"
        :interactive-block-ids="materializedSymbol?.instanceOwnedBlockIds"
        :ancestor-symbols="nestedAncestorSymbols"
        :edit-scope-root-id="editScopeRootId"
        :in-edit-scope="selfInScope"
        :scope="childScope"
        :data-context="dataContext"
        :instance-suffix="instanceSuffix"
        :asset-previews="assetPreviews"
        :slot-drop-instance-id="effectiveInteractive ? block.id : undefined"
        :circular-component-label="circularComponentLabel"
        :missing-component-label="missingComponentLabel"
        :unknown-block-label="unknownBlockLabel"
        :slot-fallback-label="slotFallbackLabel"
        :select-option-fallback-label="selectOptionFallbackLabel"
      />
      <div v-else-if="isCircular" class="uf-empty-state">
        {{ circularComponentLabel ?? t('canvas.circularComponent') }}
      </div>
      <div v-else class="uf-empty-state">
        {{ missingComponentLabel ?? t('canvas.missingComponent') }}
      </div>
    </template>
    <template v-else>
      <component
        :is="renderComponent"
        v-if="renderComponent"
        :id="block.htmlId || undefined"
        :props="displayProps"
        :class="blockClass"
        :has-children="hasChildren"
        :has-box="hasOwnBox"
        :slot-fallback-label="slotFallbackLabel"
        :select-option-fallback-label="selectOptionFallbackLabel"
      >
        <!-- Data List with sample data: render the item template once per row.
             Every copy is interactive, but copies beyond the first tag their
             data-block-id with `~rowIndex` so clicking any copy selects the one
             template block (and the overlay outlines the exact copy). Edits to
             the template reflow into all copies. -->
        <template v-if="dataListRows">
          <template v-for="(row, rowIndex) in dataListRows" :key="`row-${rowIndex}`">
            <CanvasBlockRenderer
              v-for="child in block.children"
              :key="`${child.id}~${rowIndex}`"
              :block="child"
              :registry="registry"
              :symbols="symbols"
              :editable="editable"
              :interactive="interactive"
              :interactive-block-ids="interactiveBlockIds"
              :ancestor-symbols="ancestorSymbols"
              :edit-scope-root-id="editScopeRootId"
              :in-edit-scope="selfInScope"
              :scope="row"
              :data-context="dataContext"
              :instance-suffix="rowIndex === 0 ? instanceSuffix : `${instanceSuffix}~${rowIndex}`"
              :asset-previews="assetPreviews"
              :slot-drop-instance-id="slotDropInstanceId"
              :circular-component-label="circularComponentLabel"
              :missing-component-label="missingComponentLabel"
              :unknown-block-label="unknownBlockLabel"
              :slot-fallback-label="slotFallbackLabel"
              :select-option-fallback-label="selectOptionFallbackLabel"
            />
          </template>
        </template>
        <CanvasBlockRenderer
          v-for="child in block.children"
          v-else
          :key="child.id"
          :block="child"
          :registry="registry"
          :symbols="symbols"
          :editable="editable"
          :interactive="interactive"
          :interactive-block-ids="interactiveBlockIds"
          :ancestor-symbols="ancestorSymbols"
          :edit-scope-root-id="editScopeRootId"
          :in-edit-scope="selfInScope"
          :scope="childScope"
          :data-context="dataContext"
          :instance-suffix="instanceSuffix"
          :asset-previews="assetPreviews"
          :slot-drop-instance-id="slotDropInstanceId"
          :circular-component-label="circularComponentLabel"
          :missing-component-label="missingComponentLabel"
          :unknown-block-label="unknownBlockLabel"
          :slot-fallback-label="slotFallbackLabel"
          :select-option-fallback-label="selectOptionFallbackLabel"
        />
      </component>
      <NeutralBlockHost
        v-else-if="elementTag"
        :tag="elementTag"
        :block-props="displayProps"
        :element-class="blockClass"
        :element-id="block.htmlId || undefined"
      />
      <div v-else class="uf-empty-state">
        {{ unknownBlockLabel ? unknownBlockLabel(block.type) : t('canvas.unknownBlock', { type: block.type }) }}
      </div>
    </template>
  </div>
</template>
