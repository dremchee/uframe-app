<script setup lang="ts">
import type { PageBlock } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import type { StateKey, ViewportKey } from '@/vue/components/style-panel/StyleVariantSelector.vue'
import type { EditingTarget } from '@/vue/composables/style/useBlockClasses'
import {
  Ellipsis,
  Plus,
  X,
} from '@lucide/vue'
import { computed, nextTick, provide, ref, useTemplateRef, watch } from 'vue'
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { COMPONENT_SLOT_BLOCK_TYPE, DATA_ITEM_BLOCK_TYPE, DATA_LIST_BLOCK_TYPE, getInstanceSymbolId, isComboKey, parseClassKey, resolveSettingsFields, SYMBOL_INSTANCE_BLOCK_TYPE, SYMBOL_SLOT_FILL_BLOCK_TYPE } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { cn } from '@/lib/utils'
import BlockActionsMenu from '@/vue/components/BlockActionsMenu.vue'
import ClassNameInput from '@/vue/components/ClassNameInput.vue'
import ContentTab from '@/vue/components/ContentTab.vue'
import StylePanel from '@/vue/components/style-panel/StylePanel.vue'
import StyleVariantSelector from '@/vue/components/style-panel/StyleVariantSelector.vue'
import SymbolInstancePanel from '@/vue/components/SymbolInstancePanel.vue'
import SymbolMasterPropertiesSection from '@/vue/components/SymbolMasterPropertiesSection.vue'
import {
  useBlockClasses,
} from '@/vue/composables/style/useBlockClasses'
import { useBlockParentLayout } from '@/vue/composables/style/useBlockParentLayout'
import { useBlockPropsModel } from '@/vue/composables/style/useBlockPropsModel'
import { useBlockStyleModel } from '@/vue/composables/style/useBlockStyleModel'
import { useStyleInheritance } from '@/vue/composables/style/useStyleInheritance'
import { useEditorContext } from '@/vue/context/editor-context'
import { PANEL_POPOVER_ANCHOR } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'
import { displayBlockLabel } from '@/vue/utils/block-label'

const { editor } = useEditorContext()
const { t } = useUframeI18n()

// This panel is docked right; let popovers opened from it (filter/shadow editors)
// hug its left border and open toward the canvas.
const panelEl = ref<HTMLElement | null>(null)
provide(PANEL_POPOVER_ANCHOR, { boundaryEl: panelEl, side: 'left' })

const activeTab = ref<'content' | 'style'>('style')
const elementNameInput = useTemplateRef<{ focus: () => void }>('elementNameInput')

function classChipClass(name: string): string {
  if (editingClass.value === name)
    return 'border-uf-accent bg-uf-accent text-uf-accent-foreground hover:bg-uf-accent/90'
  return 'border-uf-accent/25 bg-uf-accent/10 text-uf-accent hover:bg-uf-accent/15'
}

function classChipRemoveClass(name: string): string {
  return editingClass.value === name
    ? 'text-uf-accent-foreground/75 hover:bg-black/10 hover:text-uf-accent-foreground'
    : 'opacity-75 hover:bg-black/15 hover:opacity-100'
}

// The edited breakpoint is the toolbar viewport — single source of truth, so
// the panel tabs and the toolbar stay in sync both ways.
const viewport = computed<ViewportKey>({
  get: () => editor.editBreakpoint.value,
  set: value => editor.setEditBreakpoint(value),
})
const styleState = ref<StateKey>('default')
const editingTarget = ref<EditingTarget>({ kind: 'block' })
const newClassName = ref('')

function addBreakpoint(draft: BreakpointDraft) {
  const id = editor.addBreakpoint({
    label: draft.label,
    direction: draft.direction,
    width: draft.width,
    widthMax: draft.direction === 'between' ? draft.widthMax : undefined,
    icon: draft.icon,
  })
  if (id)
    editor.setEditBreakpoint(id)
}

function startPanelRename() {
  activeTab.value = 'style'
  // The dropdown restores focus to its trigger while it closes. Schedule this
  // after that restore so the name field keeps focus.
  void nextTick(() => requestAnimationFrame(() => elementNameInput.value?.focus()))
}

// Live-filter to Latin letters, digits, `-`, `_` and spaces (spaces get
// converted to `-` on submit). Stripping at the model layer means pasted
// text and IME input are cleaned too — not just key events.
watch(newClassName, (value) => {
  const cleaned = value.replace(/[^\w\-\s]/g, '')
  if (cleaned !== value)
    newClassName.value = cleaned
})

const block = computed(() => editor.selectedBlock.value)
const isPageSelected = computed(() => !block.value)
const editingSymbol = computed(() => {
  const id = editor.editingSymbolId.value
  return id ? editor.effectiveDocument.value.symbols?.[id] : undefined
})
const isAuthoringSymbolProperties = computed(() =>
  !!editingSymbol.value && !!block.value && block.value.type !== SYMBOL_INSTANCE_BLOCK_TYPE,
)

// ── Chip rename popover (opened by double-clicking a chip) ──────────────────
// Library classes: renaming cascades document-wide (blocks, combos, symbol
// variants) via editor.renameClass — same flow as the Classes panel.
const renameClassKey = ref<string | null>(null)
const renameClassValue = ref('')
function openClassRename(name: string) {
  renameClassKey.value = name
  renameClassValue.value = name
}
function submitClassRename() {
  const from = renameClassKey.value
  if (!from)
    return
  const to = sanitizeClassName(renameClassValue.value.trim())
  if (!to || !editor.renameClass(from, to))
    return
  renameClassKey.value = null
  // Keep the style panel pointed at the class it was editing under its new name.
  if (editingTarget.value.kind === 'class' && editingTarget.value.name === from)
    editingTarget.value = { kind: 'class', name: to }
}

// Editable mirror of the selected block's props (load + debounced commit).
const { localProps } = useBlockPropsModel(editor, block)

const { parentIsGrid, parentIsFlex } = useBlockParentLayout(editor, block, editingTarget)
const definition = computed(() =>
  block.value ? editor.registry.value[block.value.type] : undefined,
)
const settingsComponent = computed(() => definition.value?.settingsComponent)
// Framework-neutral blocks declare `settings` (schema-driven) instead of a Vue
// settingsComponent — the editor renders the form (SchemaSettings).
const settingsFields = computed(() => resolveSettingsFields(definition.value))
// Props this block can bind to CMS data — rendered as a Bindings section in the
// Content tab, independent of how the settings form is rendered.
const bindableProps = computed(() => definition.value?.bindableProps ?? [])
// Data blocks (data-list / data-item) show a Data source section.
const isDataBlock = computed(() =>
  block.value?.type === DATA_LIST_BLOCK_TYPE || block.value?.type === DATA_ITEM_BLOCK_TYPE,
)
// Whether to show the Content tab at all. Blocks without props that warrant
// editing (Section, Container, ...) have neither — hide the tab rather than
// rendering an empty pane, and snap a stale Content selection back to Style.
const hasContentTab = computed(() =>
  !!settingsComponent.value
  || !!settingsFields.value
  || bindableProps.value.length > 0
  || isDataBlock.value
  || isAuthoringSymbolProperties.value,
)
watch(hasContentTab, (next) => {
  if (!next && activeTab.value === 'content')
    activeTab.value = 'style'
})

const {
  availableClasses,
  unappliedClasses,
  blockClasses,
  applicableCombos,
  creatableCombos,
  comboMenuOpen,
  toggleComboMenu,
  createComboFromParts,
  editingClass,
  editingClassUsageCount,
  sanitizeClassName,
  focusClass,
  applyClassNamed,
  removeClass,
} = useBlockClasses({
  editor,
  block,
  editingTarget,
  newClassName,
})

const isSymbolInstance = computed(() => block.value?.type === SYMBOL_INSTANCE_BLOCK_TYPE)
const instanceSymbol = computed(() => {
  const instance = block.value
  const id = instance && isSymbolInstance.value ? getInstanceSymbolId(instance) : undefined
  return id ? editor.effectiveDocument.value.symbols?.[id] : undefined
})

function exposeSymbolProperty(prop: string, label?: string) {
  if (block.value)
    editor.addSymbolProperty(block.value.id, prop, label)
}

function removeSymbolProperty(propertyId: string) {
  if (editingSymbol.value)
    editor.removeSymbolProperty(editingSymbol.value.id, propertyId)
}

function renameSymbolProperty(propertyId: string, label: string) {
  if (editingSymbol.value)
    editor.renameSymbolProperty(editingSymbol.value.id, propertyId, label)
}

const canRenameSelectedBlock = computed(() => !!block.value
  && !isSymbolInstance.value
  && block.value.type !== COMPONENT_SLOT_BLOCK_TYPE
  && block.value.type !== SYMBOL_SLOT_FILL_BLOCK_TYPE,
)

// Switch editing target whenever the selected block changes. A block that
// already carries classes opens on its FIRST class: style edits land in the
// class instead of silently piling up in the element's unnamed local layer
// (the uf-block-<id> rule). A class-less block lands on the `block` target
// with the full editor visible — its first style edit auto-creates a class
// (see useBlockStyleModel), so styles still only ever live in classes.
watch(
  () => block.value?.id,
  () => {
    if (isPageSelected.value) {
      editingTarget.value = { kind: 'page' }
      return
    }
    const classes = block.value?.classes ?? []
    editingTarget.value = classes.length
      ? { kind: 'class', name: classes[0]! }
      : { kind: 'block' }
  },
  // `immediate` covers a panel mounted with a block already selected (dev HMR
  // remounts, restored editor state): without it the target would sit on the
  // initial `block` kind and the first edit would mint a spurious class.
  { immediate: true },
)

// The class manager (left sidebar) requests opening a class for style editing.
// Registered after the block-selection reset above so that, when a single click
// both selects an element and asks to edit its class, focusing the class wins.
watch(
  () => editor.editClassRequest.value?.nonce,
  () => {
    const req = editor.editClassRequest.value
    if (req)
      editingTarget.value = { kind: 'class', name: req.name }
  },
)

// Style editing model: active-style sync + the per-breakpoint/state slice the
// StylePanel binds to.
const { blockSlice } = useBlockStyleModel({ editor, block, editingTarget, viewport, styleState })

useStyleInheritance({ editor, block, t })

function blockLabel(block: PageBlock): string {
  return displayBlockLabel(block, editor.registry.value[block.type], t)
}

const targetLabel = computed(() => {
  if (editingTarget.value.kind === 'page')
    return t('properties.page')
  if (editingTarget.value.kind === 'class') {
    const name = editingTarget.value.name
    if (isComboKey(name))
      return t('properties.combo', { names: parseClassKey(name).join(' + ') })
    return t('properties.class', { name })
  }
  if (isSymbolInstance.value)
    return t('properties.componentTarget', { name: instanceSymbol.value?.name ?? '?' })
  return t('properties.block', { type: block.value ? blockLabel(block.value) : '' })
})
</script>

<template>
  <aside
    ref="panelEl"
    class="flex flex-col h-full w-full min-w-0 min-h-0 overflow-hidden border-l border-uf-border bg-uf-panel"
  >
    <div
      class="shrink-0 flex items-center justify-between gap-2 min-h-12 px-3.5 py-3 border-b border-uf-border"
    >
      <h2 class="m-0 text-sm font-bold truncate">
        {{ targetLabel }}
      </h2>
      <div class="flex items-center gap-1.5">
        <span v-if="editingClass" class="text-[11px] text-uf-muted">
          {{ editingClassUsageCount }}
          {{ editingClassUsageCount === 1 ? t('properties.element') : t('properties.elements') }}
        </span>
        <BlockActionsMenu
          v-if="block && !isPageSelected"
          :block="block"
          :renamable="canRenameSelectedBlock"
          @rename="startPanelRename"
        >
          <button
            type="button"
            class="inline-flex items-center justify-center h-7 w-7 rounded-md text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text data-[state=open]:bg-uf-panel-muted data-[state=open]:text-uf-text"
            :aria-label="t('properties.blockActions')"
          >
            <Ellipsis :size="15" :stroke-width="1.75" />
          </button>
        </BlockActionsMenu>
      </div>
    </div>

    <div v-if="isPageSelected" class="min-h-0 grid gap-2 p-3 overflow-auto scrollbar-hide">
      <StyleVariantSelector
        v-model:viewport="viewport"
        v-model:state="styleState"
        :breakpoints="editor.breakpoints.value"
        @add-breakpoint="addBreakpoint"
      />
      <StylePanel v-model="blockSlice" />
    </div>

    <SymbolInstancePanel
      v-else-if="isSymbolInstance && block"
      :instance="block"
      :available-classes="availableClasses"
      :sanitize-class-name="sanitizeClassName"
    />

    <div v-else class="min-h-0 grid gap-2 p-3 overflow-auto scrollbar-hide">
      <Tabs v-model="activeTab" default-value="style">
        <TabsList v-if="hasContentTab">
          <TabsTrigger value="style">
            {{ t('properties.style') }}
          </TabsTrigger>
          <TabsTrigger value="content">
            {{ t('properties.content') }}
          </TabsTrigger>
        </TabsList>

        <TabsContent v-if="hasContentTab" value="content" class="mt-2 flex flex-col gap-3 pt-2">
          <SymbolMasterPropertiesSection
            v-if="isAuthoringSymbolProperties && editingSymbol && block"
            :block="block"
            :symbol="editingSymbol"
            @expose="exposeSymbolProperty"
            @remove="removeSymbolProperty"
            @rename="renameSymbolProperty"
          />
          <ContentTab
            v-if="settingsComponent || settingsFields || bindableProps.length || isDataBlock"
            v-model="localProps"
            :settings-component="settingsComponent"
            :settings-fields="settingsFields"
            :bindable-props="bindableProps"
            :is-data-block="isDataBlock"
          />
        </TabsContent>

        <!-- Same top construction as the Content tab, so switching tabs never
             shifts the first section's offset under the tab list. -->
        <TabsContent value="style" class="mt-2 flex flex-col gap-2 pt-2">
          <section class="flex flex-col gap-1.5">
            <span
              class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider"
            >{{ t('properties.classNames') }}</span>
            <ClassNameInput
              v-model="newClassName"
              :suggestions="unappliedClasses"
              :placeholder="t('properties.addClassName')"
              @apply="applyClassNamed"
            />

            <div v-if="blockClasses.length" class="flex flex-wrap gap-1">
              <!-- Library classes: click edits the class's styles, double click
                   renames it document-wide, ✕ detaches it from this element. -->
              <Popover
                v-for="cls in blockClasses"
                :key="cls"
                :open="renameClassKey === cls"
                @update:open="(o: boolean) => (o ? openClassRename(cls) : (renameClassKey = null))"
              >
                <div class="relative">
                  <PopoverAnchor class="pointer-events-none absolute inset-0" />
                  <button
                    type="button"
                    :class="
                      cn(
                        'inline-flex items-center gap-1 min-h-5.5 py-0.5 pl-2 pr-1 rounded-sm',
                        'border text-[11px] cursor-pointer transition-colors',
                        classChipClass(cls),
                      )
                    "
                    @click="focusClass(cls)"
                    @dblclick="openClassRename(cls)"
                  >
                    <span>{{ cls }}</span>
                    <span
                      :class="cn('inline-flex items-center justify-center w-4 h-4 rounded-[2px] cursor-pointer', classChipRemoveClass(cls))"
                      role="button"
                      :aria-label="t('properties.removeClass', { name: cls })"
                      @click.stop="removeClass(cls)"
                      @dblclick.stop
                    >
                      <X :size="10" :stroke-width="2" />
                    </span>
                  </button>
                </div>
                <PopoverContent
                  class="w-60"
                  align="start"
                  :title="t('properties.renameClass')"
                  @interact-outside="preventOverlayDismiss"
                  @focus-outside="(e: Event) => e.preventDefault()"
                >
                  <form class="flex flex-col gap-3" @submit.prevent="submitClassRename">
                    <Label>
                      <span>{{ t('properties.newName') }}</span>
                      <Input v-model="renameClassValue" autofocus placeholder="class-name" />
                    </Label>
                    <p class="m-0 text-[11px] text-uf-muted leading-snug">
                      {{ t('properties.classRenameHint') }}
                    </p>
                    <div class="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" @click="renameClassKey = null">
                        {{ t('common.cancel') }}
                      </Button>
                      <Button type="submit" size="sm">
                        {{ t('common.edit') }}
                      </Button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
            </div>

            <div v-if="blockClasses.length >= 2" class="flex flex-col gap-1">
              <span
                class="text-uf-muted uppercase tracking-wider font-semibold text-[11px]"
              >{{ t('properties.combos') }}</span>
              <!-- eslint-disable-next-line vue/no-unused-refs -- bound via useTemplateRef('comboMenuRef') inside useBlockClasses (outside-click), so it isn't referenced in this component's script. -->
              <div ref="comboMenuRef" class="relative self-start">
                <button
                  type="button"
                  :disabled="!creatableCombos.length"
                  class="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text disabled:cursor-not-allowed disabled:opacity-50"
                  @click="toggleComboMenu"
                >
                  <Plus :size="13" :stroke-width="2" />
                  <span>{{ t('properties.addCombo') }}</span>
                </button>
                <div
                  v-if="comboMenuOpen && creatableCombos.length"
                  class="absolute left-0 top-full z-10 mt-1 min-w-40 max-h-48 overflow-auto border border-uf-border rounded-md bg-uf-panel shadow-md scrollbar-hide"
                >
                  <button
                    v-for="combo in creatableCombos"
                    :key="combo.key"
                    type="button"
                    class="block w-full text-left px-2 py-1 text-[11px] text-uf-text cursor-pointer hover:bg-uf-panel-muted"
                    @click="createComboFromParts(combo.parts)"
                  >
                    {{ combo.parts.join(' + ') }}
                  </button>
                </div>
              </div>

              <div v-if="applicableCombos.length" class="flex flex-wrap gap-1">
                <button
                  v-for="combo in applicableCombos"
                  :key="combo.key"
                  type="button"
                  :class="
                    cn(
                      'inline-flex items-center min-h-5.5 px-2 py-0.5 rounded-sm',
                      'border bg-uf-panel text-[11px] cursor-pointer transition-colors',
                      editingClass === combo.key
                        ? 'border-uf-accent bg-uf-accent/10 text-uf-accent-strong'
                        : 'border-uf-border text-uf-text hover:border-uf-border-strong',
                    )
                  "
                  @click="focusClass(combo.key)"
                >
                  {{ combo.parts.join(' + ') }}
                </button>
              </div>
            </div>
          </section>

          <section v-if="canRenameSelectedBlock && block" class="flex flex-col gap-1.5">
            <span
              class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider"
            >{{ t('properties.elementName') }}</span>
            <Input
              ref="elementNameInput"
              :model-value="block.name ?? ''"
              type="text"
              :placeholder="blockLabel(block)"
              @update:model-value="
                (v) => block && editor.setBlockName(block.id, String(v))
              "
            />
          </section>

          <section v-if="block" class="flex flex-col gap-1.5 mb-2">
            <span
              class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider"
            >{{ t('properties.elementId') }}</span>
            <Input
              :model-value="block.htmlId ?? ''"
              type="text"
              placeholder="id"
              @update:model-value="
                (v) => block && editor.setBlockHtmlId(block.id, String(v))
              "
            />
          </section>

          <StyleVariantSelector
            v-model:viewport="viewport"
            v-model:state="styleState"
            :breakpoints="editor.breakpoints.value"
            @add-breakpoint="addBreakpoint"
          />
          <!-- A class-less element (fresh from the library, or after removing
               its last class) shows the full editor too: the first edit
               extracts into an auto-named class and the panel retargets to it,
               so styles still always land in a named class. -->
          <StylePanel v-model="blockSlice" :parent-is-grid="parentIsGrid" :parent-is-flex="parentIsFlex" />
        </TabsContent>
      </Tabs>
    </div>

    <div
      v-if="editor.errors.value.length"
      class="m-3 p-2.5 border border-rose-200 rounded-pb bg-rose-50 text-uf-danger text-xs"
    >
      <p v-for="error in editor.errors.value" :key="error" class="m-0 mb-1.5">
        {{ error }}
      </p>
    </div>
  </aside>
</template>
