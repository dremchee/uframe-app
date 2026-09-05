<script setup lang="ts">
import type { Component } from 'vue'
import type { AlignValue, BaseBlockStyles, LayoutMode, PageBlock, WidthMode } from '@/core'
import {
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Columns3,
  LayoutGrid,
  Minus,
  MoveHorizontal,
  Plus,
  Rows3,
  Ruler,
  Scan,
  Shrink,
  Square,
  WrapText,
} from '@lucide/vue'
import { computed } from 'vue'
import {
  IconButton,
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldStepper,
  SegmentControl,
  SizeInput,
  Tooltip,
} from '@/components/ui'
import {
  applyAlignment,
  applyLayoutMode,
  applyWidthMode,
  composeGap,
  ELEMENT_BLOCK_TYPE,
  gapAxis,
  mergeStyles,
  resolveAlignment,
  resolveGridColumnCount,
  resolveLayoutMode,
  resolveUniformPadding,
  resolveWidthMode,
  toggleDistribution,
  withGridColumnCount,
  withUniformPadding,
} from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { canRemoveLayoutCell } from '@/vue/utils/quick-layout-cell'
import BindableField from './BindableField.vue'

/**
 * The Element block's quick panel: the handful of layout decisions a layout
 * prototype is made of — stack direction, column count, alignment, gap,
 * padding, width — as icon controls over the ordinary style keys. Bound to the
 * active style slice like any Style-panel section, so breakpoints, states,
 * classes and undo apply unchanged. `compact` is the floating canvas panel's
 * collapsed row: the essentials only.
 */
const props = defineProps<{
  modelValue: BaseBlockStyles
  /** The selected block — enables the cell (+ / −) actions on containers. */
  block?: PageBlock
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()
const styles = computed(() => props.modelValue)

function update(next: BaseBlockStyles) {
  emit('update:modelValue', next)
}

// ── Layout mode ─────────────────────────────────────────────────────────────

const mode = computed(() => resolveLayoutMode(styles.value))
const modeOptions = computed<Array<{ value: LayoutMode, label: string, icon: Component }>>(() => [
  { value: 'block', label: t('style.layoutBlock'), icon: Square },
  { value: 'column', label: t('style.layoutColumn'), icon: Rows3 },
  { value: 'row', label: t('style.layoutRow'), icon: Columns3 },
  { value: 'grid', label: t('style.layoutGrid'), icon: LayoutGrid },
])

function setMode(next: LayoutMode) {
  update(applyLayoutMode(styles.value, next))
}

// ── Alignment (3 × 3) ──────────────────────────────────────────────────────

const ALIGN_VALUES: AlignValue[] = ['start', 'center', 'end']
const alignment = computed(() => resolveAlignment(styles.value, mode.value))
const alignHorizontal: Record<AlignValue, string> = { start: 'alignHorizontalStart', center: 'alignMiddle', end: 'alignHorizontalEnd' }
const alignVertical: Record<AlignValue, string> = { start: 'alignTop', center: 'alignMiddle', end: 'alignBottom' }
const alignCells = computed(() => ALIGN_VALUES.flatMap(vertical => ALIGN_VALUES.map(horizontal => ({
  key: `${horizontal}-${vertical}`,
  horizontal,
  vertical,
  active: alignment.value.horizontal === horizontal && alignment.value.vertical === vertical,
  label: t('style.alignTo', { horizontal: t(`style.${alignHorizontal[horizontal]}`), vertical: t(`style.${alignVertical[vertical]}`) }),
}))))

function setAlignment(horizontal: AlignValue, vertical: AlignValue) {
  update(applyAlignment(styles.value, mode.value, horizontal, vertical))
}

const isWrapped = computed(() => styles.value.flexWrap === 'wrap' || styles.value.flexWrap === 'wrap-reverse')
function toggleWrap() {
  update(mergeStyles(styles.value, { flexWrap: isWrapped.value ? 'nowrap' : 'wrap' }))
}

function toggleDistribute() {
  update(toggleDistribution(styles.value, mode.value))
}

// ── Gap / columns ───────────────────────────────────────────────────────────

// One linked value, like GapControl's default state; a split gap collapses to
// the column gap here and re-links on edit.
const gap = computed(() => gapAxis(styles.value, 'column'))
function setGap(value: string) {
  update(mergeStyles(styles.value, { gap: composeGap(value, value, false) }))
}

const columnCount = computed(() => resolveGridColumnCount(styles.value))
function setColumnCount(value: number | undefined) {
  if (value != null && Number.isFinite(value))
    update(withGridColumnCount(styles.value, value))
}

// ── Padding / width ────────────────────────────────────────────────────────

const padding = computed(() => resolveUniformPadding(styles.value))
function setPadding(value: string) {
  update(withUniformPadding(styles.value, value))
}

const widthMode = computed(() => resolveWidthMode(styles.value))
const widthOptions = computed<Array<{ value: WidthMode, label: string, icon: Component }>>(() => [
  { value: 'auto', label: t('style.widthAuto'), icon: Scan },
  { value: 'fill', label: t('style.widthFill'), icon: MoveHorizontal },
  { value: 'hug', label: t('style.widthHug'), icon: Shrink },
  { value: 'fixed', label: t('style.widthFixed'), icon: Ruler },
])
function setWidthMode(next: WidthMode) {
  update(applyWidthMode(styles.value, next))
}
function setWidth(value: string) {
  update(mergeStyles(styles.value, { width: value }))
}

// ── Cells ──────────────────────────────────────────────────────────────────
// Children of the selected container, added and removed as plain Elements. An
// action on the document rather than a stored count: the number of cells is
// whatever the tree holds. Removal only takes an empty trailing cell — content
// is never deleted from here.

const container = computed(() => {
  const block = props.block
  return block && editor.registry.value[block.type]?.acceptsChildren ? block : undefined
})
const cellCount = computed(() => container.value?.children?.length ?? 0)
const lastCell = computed(() => container.value?.children?.at(-1))
const canRemoveCell = computed(() => canRemoveLayoutCell(lastCell.value))

function addCell() {
  const target = container.value
  if (!target)
    return
  // addBlock selects the new child; keep the container selected so the panel
  // stays on it. One history entry for the pair.
  editor.beginTransient('history.addBlock')
  editor.addBlock(ELEMENT_BLOCK_TYPE, target.id)
  editor.selectBlock(target.id)
  editor.endTransient()
}

// removeBlock leaves the selection alone unless the removed block was selected,
// so the container (and this panel) stay put.
function removeCell() {
  const cell = lastCell.value
  if (cell && canRemoveCell.value)
    editor.removeBlock(cell.id)
}

const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider leading-none'
const alignCellClass = 'grid size-7 place-items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent'
</script>

<template>
  <!-- Compact: the floating panel's single row. -->
  <div v-if="compact" class="flex flex-wrap items-center gap-1.5">
    <SegmentControl
      class="shrink-0"
      :model-value="mode"
      :options="modeOptions"
      :aria-label="t('style.layoutMode')"
      @update:model-value="setMode"
    />
    <template v-if="mode !== 'block'">
      <div class="w-28 shrink-0">
        <BindableField type="size" :model-value="gap" @update:model-value="setGap">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :min="0" :placeholder="t('style.gap')" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </div>
      <Tooltip v-if="mode === 'grid'" :text="columnCount == null ? t('style.editTracks') : t('style.columnsPerRow')">
        <div class="w-28 shrink-0">
          <NumberField :model-value="columnCount ?? undefined" :min="1" :max="24" :aria-label="t('style.columnsPerRow')" @update:model-value="setColumnCount">
            <NumberFieldContent>
              <NumberFieldInput :placeholder="t('style.customTracks')" />
              <NumberFieldStepper class="w-14 flex-row">
                <NumberFieldIncrement class="h-full w-7" />
                <NumberFieldDecrement class="h-full w-7" />
              </NumberFieldStepper>
            </NumberFieldContent>
          </NumberField>
        </div>
      </Tooltip>
      <template v-else>
        <Tooltip :text="t('style.wrapItems')">
          <IconButton :class="isWrapped && 'bg-uf-accent/10 text-uf-accent hover:text-uf-accent'" :aria-pressed="isWrapped" :aria-label="t('style.wrapItems')" @click="toggleWrap">
            <WrapText :size="14" :stroke-width="1.75" />
          </IconButton>
        </Tooltip>
        <Tooltip :text="t('style.distribute')">
          <IconButton :class="alignment.distributed && 'bg-uf-accent/10 text-uf-accent hover:text-uf-accent'" :aria-pressed="alignment.distributed" :aria-label="t('style.distribute')" @click="toggleDistribute">
            <component :is="mode === 'column' ? AlignVerticalSpaceBetween : AlignHorizontalSpaceBetween" :size="14" :stroke-width="1.75" />
          </IconButton>
        </Tooltip>
      </template>
    </template>
    <div v-if="container" class="ml-auto flex items-center gap-0.5">
      <span :title="t('style.cellsHint')" class="px-1 text-[11px] tabular-nums text-uf-muted">{{ t('style.cells') }} · {{ cellCount }}</span>
      <Tooltip :text="canRemoveCell ? t('style.removeCell') : t('style.removeCellBlocked')">
        <IconButton size="sm" :disabled="!canRemoveCell" :aria-label="t('style.removeCell')" @click="removeCell">
          <Minus :size="13" :stroke-width="2" />
        </IconButton>
      </Tooltip>
      <Tooltip :text="t('style.addCell')">
        <IconButton size="sm" :aria-label="t('style.addCell')" @click="addCell">
          <Plus :size="13" :stroke-width="2" />
        </IconButton>
      </Tooltip>
    </div>
  </div>

  <!-- Full: the properties-panel section and the expanded floating panel. -->
  <div v-else class="grid gap-2.5">
    <div class="grid gap-1">
      <span :class="fieldLabel">{{ t('style.layoutMode') }}</span>
      <SegmentControl
        :model-value="mode"
        :options="modeOptions"
        :aria-label="t('style.layoutMode')"
        @update:model-value="setMode"
      />
    </div>

    <div v-if="mode !== 'block'" class="flex items-start gap-3">
      <div class="grid gap-1">
        <span :class="fieldLabel">{{ t('style.alignment') }}</span>
        <div
          class="grid w-fit grid-cols-3 gap-0.5 rounded-md border border-uf-border bg-uf-panel-muted p-1"
          role="group"
          :aria-label="t('style.alignment')"
        >
          <button
            v-for="cell in alignCells"
            :key="cell.key"
            type="button"
            :class="[alignCellClass, cell.active ? 'bg-uf-accent text-uf-accent-foreground' : 'text-uf-muted hover:bg-uf-panel hover:text-uf-text']"
            :aria-label="cell.label"
            :aria-pressed="cell.active"
            :title="cell.label"
            @click="setAlignment(cell.horizontal, cell.vertical)"
          >
            <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="grid min-w-0 flex-1 gap-2">
        <div class="grid gap-1">
          <span :class="fieldLabel">{{ t('style.gap') }}</span>
          <BindableField type="size" :model-value="gap" @update:model-value="setGap">
            <template #default="{ value, setValue, requestBind }">
              <SizeInput bindable :min="0" placeholder="0" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
            </template>
          </BindableField>
        </div>
        <div v-if="mode === 'grid'" class="grid gap-1">
          <span :class="fieldLabel">{{ t('style.columnsPerRow') }}</span>
          <Tooltip v-if="columnCount == null" :text="t('style.editTracks')">
            <div>
              <NumberField :model-value="undefined" :min="1" :max="24" :aria-label="t('style.columnsPerRow')" @update:model-value="setColumnCount">
                <NumberFieldContent>
                  <NumberFieldInput :placeholder="t('style.customTracks')" />
                  <NumberFieldStepper class="w-14 flex-row">
                    <NumberFieldIncrement class="h-full w-7" />
                    <NumberFieldDecrement class="h-full w-7" />
                  </NumberFieldStepper>
                </NumberFieldContent>
              </NumberField>
            </div>
          </Tooltip>
          <NumberField v-else :model-value="columnCount" :min="1" :max="24" :aria-label="t('style.columnsPerRow')" @update:model-value="setColumnCount">
            <NumberFieldContent>
              <NumberFieldInput />
              <NumberFieldStepper class="w-14 flex-row">
                <NumberFieldIncrement class="h-full w-7" />
                <NumberFieldDecrement class="h-full w-7" />
              </NumberFieldStepper>
            </NumberFieldContent>
          </NumberField>
        </div>
        <div v-else class="flex items-center gap-1">
          <Tooltip :text="t('style.wrapItems')">
            <IconButton size="lg" :class="isWrapped && 'bg-uf-accent/10 text-uf-accent hover:text-uf-accent'" :aria-pressed="isWrapped" :aria-label="t('style.wrapItems')" @click="toggleWrap">
              <WrapText :size="15" :stroke-width="1.75" />
            </IconButton>
          </Tooltip>
          <Tooltip :text="t('style.distribute')">
            <IconButton size="lg" :class="alignment.distributed && 'bg-uf-accent/10 text-uf-accent hover:text-uf-accent'" :aria-pressed="alignment.distributed" :aria-label="t('style.distribute')" @click="toggleDistribute">
              <component :is="mode === 'column' ? AlignVerticalSpaceBetween : AlignHorizontalSpaceBetween" :size="15" :stroke-width="1.75" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="grid gap-1">
        <span :class="fieldLabel">{{ t('style.padding') }}</span>
        <BindableField type="size" :model-value="padding.kind === 'uniform' ? padding.value : ''" @update:model-value="setPadding">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :min="0" :placeholder="padding.kind === 'mixed' ? t('style.mixed') : '0'" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </div>
      <div class="grid gap-1">
        <span :class="fieldLabel">{{ t('style.widthMode') }}</span>
        <SegmentControl
          :model-value="widthMode"
          :options="widthOptions"
          :aria-label="t('style.widthMode')"
          @update:model-value="setWidthMode"
        />
      </div>
    </div>
    <div v-if="widthMode === 'fixed'" class="grid gap-1">
      <span :class="fieldLabel">{{ t('style.width') }}</span>
      <BindableField type="size" :model-value="styles.width ?? ''" @update:model-value="setWidth">
        <template #default="{ value, setValue, requestBind }">
          <SizeInput bindable :min="0" placeholder="auto" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
        </template>
      </BindableField>
    </div>

    <p v-if="container && mode === 'grid'" class="text-[11px] leading-snug text-uf-muted">
      {{ t('style.cellsHint') }}
    </p>
    <div v-if="container" class="flex items-center justify-between gap-2">
      <span :title="t('style.cellsHint')" :class="fieldLabel">{{ t('style.cells') }} · <span class="tabular-nums">{{ cellCount }}</span></span>
      <div class="flex items-center gap-0.5">
        <Tooltip :text="canRemoveCell ? t('style.removeCell') : t('style.removeCellBlocked')">
          <IconButton :disabled="!canRemoveCell" :aria-label="t('style.removeCell')" @click="removeCell">
            <Minus :size="14" :stroke-width="2" />
          </IconButton>
        </Tooltip>
        <Tooltip :text="t('style.addCell')">
          <IconButton :aria-label="t('style.addCell')" @click="addCell">
            <Plus :size="14" :stroke-width="2" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
