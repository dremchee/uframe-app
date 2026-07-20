<script setup lang="ts">
import type { CssVariable } from '@/core'
import type { VariableDraft } from '@/vue/components/VariableForm.vue'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { BookOpen, Plus } from '@lucide/vue'
import { provide, ref } from 'vue'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import TemplateStyleGuide from '@/vue/components/TemplateStyleGuide.vue'
import VariableForm from '@/vue/components/VariableForm.vue'
import VariableRow from '@/vue/components/VariableRow.vue'
import { makePanelEdgeReference, PANEL_POPOVER_ANCHOR } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
}>()

const editor = props.editor
const { t } = useUframeI18n()

// This panel is docked left; popovers opened from it (the add/edit variable forms
// and the nested shadow editor) hug its right border and open toward the canvas.
const panelEl = ref<HTMLElement | null>(null)
provide(PANEL_POPOVER_ANCHOR, { boundaryEl: panelEl, side: 'right' })

// "Add variable" popover anchors to the panel edge at the add-button's level.
const addAreaEl = ref<HTMLElement | null>(null)
const addReference = makePanelEdgeReference(panelEl, addAreaEl, 'right')

function emptyDraft(): VariableDraft {
  return { name: '', val: '', type: 'color' }
}

// ── Add via popover form ────────────────────────────────────────────────────
// The variable is only appended on submit, so the list never shows half-filled
// placeholder rows.
const addOpen = ref(false)
const styleGuideOpen = ref(false)
const addDraft = ref<VariableDraft>(emptyDraft())

function onAddOpenChange(open: boolean) {
  addOpen.value = open
  if (open)
    addDraft.value = emptyDraft()
}

function submitAdd() {
  editor.addVariable({ name: addDraft.value.name, value: addDraft.value.val, type: addDraft.value.type })
  addOpen.value = false
}

function updateVariable(index: number, patch: Partial<CssVariable>) {
  editor.updateVariable(index, patch)
}
</script>

<template>
  <section ref="panelEl" class="flex flex-col min-h-0 h-full overflow-hidden">
    <div ref="addAreaEl" class="shrink-0 px-3 pt-3">
      <Popover :open="addOpen" @update:open="onAddOpenChange">
        <PopoverTrigger as-child>
          <Button variant="subtle" size="sm" class="w-full" :icon="Plus">
            {{ t('variables.add') }}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          class="w-64"
          side="right"
          align="start"
          :reference="addReference"
          :title="t('variables.addTitle')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(e: Event) => e.preventDefault()"
        >
          <VariableForm
            v-model="addDraft"
            :submit-label="t('common.add')"
            @submit="submitAdd"
            @cancel="onAddOpenChange(false)"
          />
        </PopoverContent>
      </Popover>
    </div>

    <ScrollArea class="flex-1 min-h-0 flex flex-col gap-1.5 p-3 overflow-auto">
      <VariableRow
        v-for="(variable, index) in editor.variables.value"
        :key="index"
        :variable="variable"
        :index="index"
        @update="updateVariable"
        @remove="editor.removeVariable"
        @reorder="editor.reorderVariables"
      />

      <p
        v-if="!editor.variables.value.length"
        class="px-2 py-6 text-center text-[12px] text-uf-muted leading-snug"
      >
        {{ t('variables.empty') }}
      </p>

      <div class="-mx-3 mt-1 border-t border-uf-border pt-3" />
      <div class="flex items-center gap-3 rounded-md border border-uf-border bg-uf-panel px-3 py-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-uf-accent/10 text-uf-accent"><BookOpen :size="17" :stroke-width="1.75" /></span>
        <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-uf-text">Style guide</span><span class="mt-0.5 block truncate text-xs text-uf-muted">Colors, type, spacing, and shadows</span></span>
        <Button size="sm" @click="styleGuideOpen = true">
          Open
        </Button>
      </div>
    </ScrollArea>

    <Dialog v-model:open="styleGuideOpen">
      <DialogContent class="max-h-[85vh] max-w-3xl overflow-y-auto p-3 sm:p-3">
        <DialogHeader class="px-3 pt-3">
          <DialogTitle>Template style guide</DialogTitle>
        </DialogHeader>
        <div class="px-3 pb-3">
          <TemplateStyleGuide :editor="editor" />
        </div>
      </DialogContent>
    </Dialog>
  </section>
</template>
