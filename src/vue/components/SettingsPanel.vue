<script setup lang="ts">
import type { Component } from 'vue'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import type { SidebarPanelAction } from '@/vue/composables/ui/useSidebar'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Plus, RotateCcw } from '@lucide/vue'
import { computed, provide, ref } from 'vue'
import { Button, ColorInput, Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@/components/ui'
import { breakpointUpperBound } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { autoIconKey } from '@/vue/components/breakpoint-icons'
import BreakpointForm from '@/vue/components/BreakpointForm.vue'
import BreakpointRow from '@/vue/components/BreakpointRow.vue'
import BreakpointTrack from '@/vue/components/BreakpointTrack.vue'
import FontsSection from '@/vue/components/FontsSection.vue'
import FontFamilySelect from '@/vue/components/style-panel/FontFamilySelect.vue'
import { makePanelEdgeReference, PANEL_POPOVER_ANCHOR } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
  /** Plugin-contributed sections, rendered before the built-in ones. */
  sections?: Component[]
}>()

const editor = props.editor
const { t } = useUframeI18n()

// Popovers opened from this docked panel hug its right edge (canvas side) via
// a virtual reference, instead of overlapping the panel. Shared with the rows
// and FontsSection through the panel anchor.
const panelEl = ref<HTMLElement | null>(null)
provide(PANEL_POPOVER_ANCHOR, { boundaryEl: panelEl, side: 'right' })
const addBreakpointAreaEl = ref<HTMLElement | null>(null)
const addBreakpointReference = makePanelEdgeReference(panelEl, addBreakpointAreaEl, 'right')

function emptyDraft(): BreakpointDraft {
  const base = { label: '', direction: 'max' as const, width: 600 }
  return { ...base, icon: autoIconKey(base) }
}

// Add via popover form — appended only on submit, mirroring the Variables panel.
const addOpen = ref(false)
const addDraft = ref<BreakpointDraft>(emptyDraft())
const addError = ref('')

function onAddOpenChange(open: boolean) {
  addOpen.value = open
  if (open) {
    addDraft.value = emptyDraft()
    addError.value = ''
  }
}

function runPanelAction(command: SidebarPanelAction) {
  if (command?.target === 'settings' && command.action === 'add-breakpoint')
    onAddOpenChange(true)
}

defineExpose({ runPanelAction })

const sortedBreakpoints = computed(() =>
  editor.breakpoints.value.slice().sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a)),
)

// Shared hover so the track and the rows cross-highlight each other.
const hoveredBreakpointId = ref<string | null>(null)

function submitAdd() {
  const d = addDraft.value
  const id = editor.addBreakpoint({
    label: d.label,
    direction: d.direction,
    width: d.width,
    widthMax: d.direction === 'between' ? d.widthMax : undefined,
    icon: d.icon,
  })
  if (!id) {
    addError.value = t('breakpoints.duplicateRange')
    return
  }
  addOpen.value = false
}

// ── Global defaults (shared page background + base font) ──────────────────────
// Only meaningful when a shared context (globals) is present; a page can still
// override these on itself via its page style.
const hasGlobals = computed(() => editor.globals.value != null)
const defaultBackground = computed(() => editor.globals.value?.defaults?.background ?? '')
const defaultFontFamily = computed(() => editor.globals.value?.defaults?.style?.fontFamily ?? '')

function setDefaultBackground(value: string) {
  editor.setGlobalDefaults({ background: value.trim() || undefined })
}
function setDefaultFontFamily(value: string) {
  const fontFamily = value.trim()
  editor.setGlobalDefaults({ style: { ...editor.globals.value?.defaults?.style, fontFamily: fontFamily || undefined } })
}

// Stacked field label, matching BreakpointForm / the style-panel fields.
const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'
</script>

<template>
  <section ref="panelEl" class="flex flex-col min-h-0 h-full overflow-hidden">
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-col">
        <!-- Plugin-contributed sections (e.g. the AI plugin's config). -->
        <component :is="c" v-for="(c, i) in sections" :key="i" :editor="editor" />

        <div v-if="hasGlobals" class="flex flex-col gap-2.5 px-3 pt-3 pb-3 border-b border-uf-border">
          <p class="m-0 text-[11px] leading-snug text-uf-muted">
            {{ t('settings.globalDefaults') }}
          </p>
          <div class="flex flex-col gap-1">
            <span :class="fieldLabel">{{ t('settings.background') }}</span>
            <ColorInput
              :model-value="defaultBackground"
              placeholder="#ffffff"
              @update:model-value="setDefaultBackground"
            />
          </div>
          <div class="flex flex-col gap-1">
            <span :class="fieldLabel">{{ t('settings.font') }}</span>
            <FontFamilySelect
              :model-value="defaultFontFamily"
              :placeholder="t('settings.fontPlaceholder')"
              @update:model-value="setDefaultFontFamily"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2.5 px-3 pt-3 pb-3 border-b border-uf-border">
          <FontsSection :editor="editor" />
        </div>

        <div ref="addBreakpointAreaEl" class="px-3 pt-3">
          <p class="m-0 mb-2 text-[11px] leading-snug text-uf-muted">
            {{ t('breakpoints.hint') }}
          </p>
          <Popover :open="addOpen" @update:open="onAddOpenChange">
            <PopoverTrigger as-child>
              <Button variant="subtle" size="sm" class="w-full" :icon="Plus">
                {{ t('breakpoints.add') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              class="w-64"
              side="right"
              align="start"
              :reference="addBreakpointReference"
              :title="t('breakpoints.addTitle')"
              @interact-outside="preventOverlayDismiss"
              @focus-outside="preventOverlayDismiss"
            >
              <BreakpointForm
                :model-value="addDraft"
                :error="addError"
                :submit-label="t('common.add')"
                @update:model-value="(value) => { addDraft = value; addError = '' }"
                @submit="submitAdd"
                @cancel="onAddOpenChange(false)"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div class="px-3 pt-3">
          <BreakpointTrack
            :breakpoints="editor.breakpoints.value"
            :hovered-id="hoveredBreakpointId"
            @hover="hoveredBreakpointId = $event"
          />
        </div>

        <div class="flex flex-col gap-1.5 p-3">
          <BreakpointRow
            v-for="bp in sortedBreakpoints"
            :key="bp.id"
            :breakpoint="bp"
            :breakpoints="editor.breakpoints.value"
            :highlighted="bp.id === hoveredBreakpointId"
            @update="editor.updateBreakpoint"
            @remove="editor.removeBreakpoint"
            @hover="hoveredBreakpointId = $event"
          />

          <Button
            variant="ghost"
            size="sm"
            class="mt-1 w-full justify-center gap-1.5 text-uf-muted"
            @click="editor.resetBreakpoints()"
          >
            <RotateCcw :size="13" :stroke-width="1.75" />
            {{ t('breakpoints.reset') }}
          </Button>
        </div>
      </div>
    </ScrollArea>
  </section>
</template>
