<script setup lang="ts">
import type { SidebarPanelAction } from '@/vue/composables/ui/useSidebar'
import { nextTick, shallowRef, useTemplateRef, watch } from 'vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui'
import CanvasQuickPanel from '@/vue/components/canvas/CanvasQuickPanel.vue'
import CanvasViewport from '@/vue/components/canvas/CanvasViewport.vue'
import PagePreview from '@/vue/components/canvas/PagePreview.vue'
import EditorToolbar from '@/vue/components/editor/EditorToolbar.vue'
import SidebarPanels from '@/vue/components/editor/SidebarPanels.vue'
import SidebarRail from '@/vue/components/editor/SidebarRail.vue'
import ViewportControls from '@/vue/components/editor/ViewportControls.vue'
import PropertiesPanel from '@/vue/components/properties/PropertiesPanel.vue'
import { useEditorShellLayout } from '@/vue/composables/ui/useEditorShellLayout'
import { useSidebar } from '@/vue/composables/ui/useSidebar'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

// Plugin-supplied CSS custom properties, applied as inline style on the
// `.uf-editor` root so they recolour the chrome (and cascade into portaled
// reka-ui content via the var inheritance, since those read the same tokens).
defineProps<{
  styleTokens?: Record<string, string>
  toolbarVisible?: boolean
}>()

const { editor, pluginSlots } = useEditorContext()
const { t } = useUframeI18n()
const rulerMode = shallowRef(false)
const sidebar = useSidebar(editor, pluginSlots.panels)
const rootEl = useTemplateRef<HTMLElement>('rootEl')
const flyoutRef = useTemplateRef<HTMLElement>('flyoutRef')
const dockedPanels = useTemplateRef<InstanceType<typeof SidebarPanels>>('dockedPanels')
const flyoutPanels = useTemplateRef<InstanceType<typeof SidebarPanels>>('flyoutPanels')
let nextPanelActionId = 0

// Selecting an element on the canvas surfaces the Layers panel (element tree).
// The canvas bumps `revealInTreeRequest` only for a real block hit (not empty
// clicks), so this fires exactly on canvas selection. If the panel floats and
// is open, it follows; a closed flyout is left closed (no pop on every click).
watch(() => editor.revealInTreeRequest.value?.nonce, (nonce) => {
  if (nonce != null)
    sidebar.mode.value = 'layers'
})

// Panels sit as separate surfaces with a compact, visible resize gutter. Its
// dotted grip makes the draggable area discoverable without adding whitespace
// around the panels.
const RESIZE_HANDLE = 'group z-20 w-[5px] shrink-0 cursor-col-resize bg-transparent text-uf-muted transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-[3px] after:-translate-x-1/2 after:content-[""] after:transition-colors hover:after:bg-uf-accent hover:text-uf-accent active:after:bg-uf-accent'

// Keep the inspector compact on wide screens while preserving drag-resize.
// Reka's px sizing is the splitter equivalent of clamp(320px, 380px, 480px):
// the canvas takes the remaining relative space and the inspector stays fixed.
const PROPERTIES_PANEL_DEFAULT_WIDTH = 380
const PROPERTIES_PANEL_MIN_WIDTH = 320
const PROPERTIES_PANEL_MAX_WIDTH = 480

const {
  startPanelResize,
} = useEditorShellLayout({ sidebar, rootEl, flyoutRef })

function runPanelAction(target: string, action: string) {
  const command: SidebarPanelAction = { id: ++nextPanelActionId, target, action }
  sidebar.selectMode(target)
  void nextTick(() => {
    const panels = sidebar.pinned.value ? dockedPanels.value : flyoutPanels.value
    panels?.runPanelAction(command)
  })
}

function openAddBreakpoint() {
  runPanelAction('settings', 'add-breakpoint')
}

defineExpose({ openAddBreakpoint, runPanelAction })
</script>

<template>
  <div
    ref="rootEl"
    class="uf-editor flex flex-col h-screen overflow-hidden bg-uf-panel-muted text-uf-text font-pb text-sm leading-tight transition-colors duration-150"
    :style="styleTokens"
  >
    <EditorToolbar v-if="toolbarVisible !== false" />
    <PagePreview
      v-if="editor.isPreviewMode.value"
      class="mx-auto w-full"
      :document="editor.effectiveDocument.value"
      :blocks="editor.registry.value"
      :width="editor.canvasWidth.value"
    />
    <div
      v-else
      class="m-1 flex flex-1 min-h-0 rounded-xl bg-uf-panel-muted p-1"
      :class="sidebar.pinned.value ? 'gap-0' : 'gap-1'"
    >
      <div class="flex min-h-0 shrink-0 overflow-hidden rounded-lg border border-uf-border bg-uf-panel">
        <SidebarRail
          class="uf-sidebar-rail"
          :class="sidebar.pinned.value && 'border-r border-uf-border'"
          :mode="sidebar.pinned.value || sidebar.flyoutOpen.value ? sidebar.mode.value : null"
          :panels="pluginSlots.panels"
          :multi-page="editor.isMultiPage.value"
          @select="sidebar.selectMode"
        />
        <SidebarPanels
          v-if="sidebar.pinned.value"
          ref="dockedPanels"
          :editor="editor"
          :sidebar="sidebar"
          :panels="pluginSlots.panels"
          class="min-h-0 shrink-0 border-0"
          :style="{ width: `${sidebar.panelWidth.value}px` }"
        />
      </div>
      <!-- Docked panel (pinned): a resizable column that pushes the canvas. -->
      <template v-if="sidebar.pinned.value">
        <div
          class="relative" :class="[RESIZE_HANDLE]"
          role="separator"
          aria-orientation="vertical"
          :aria-label="t('canvas.resizePanel')"
          @pointerdown="startPanelResize"
        >
          <span class="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-px opacity-70 group-hover:opacity-100" aria-hidden="true">
            <span class="size-[2px] rounded-full bg-current" />
            <span class="size-[2px] rounded-full bg-current" />
            <span class="size-[2px] rounded-full bg-current" />
          </span>
        </div>
      </template>
      <div class="relative flex-1 min-w-0 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          auto-save-id="uf-editor-shell-v2"
          class="h-full"
        >
          <ResizablePanel allow-overflow :min-size="40">
            <main class="flex h-full min-w-0 min-h-0 flex-col overflow-hidden rounded-lg border border-uf-border bg-uf-panel shadow-sm">
              <ViewportControls v-model:ruler-mode="rulerMode" @add-breakpoint="openAddBreakpoint" />
              <CanvasViewport class="min-h-0 flex-1" :ruler-mode="rulerMode" />
            </main>
          </ResizablePanel>
          <ResizableHandle with-handle class="mx-0 w-1.5 bg-transparent" />
          <ResizablePanel
            allow-overflow
            class="min-w-0 [contain:inline-size]"
            size-unit="px"
            :default-size="PROPERTIES_PANEL_DEFAULT_WIDTH"
            :min-size="PROPERTIES_PANEL_MIN_WIDTH"
            :max-size="PROPERTIES_PANEL_MAX_WIDTH"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
        <!-- Floating flyout (unpinned): overlays the canvas, dismissed on blur. -->
        <template v-if="!sidebar.pinned.value && sidebar.flyoutOpen.value">
          <div
            ref="flyoutRef"
            class="absolute inset-y-0 left-0 z-30 overflow-hidden rounded-lg border border-uf-border bg-uf-panel shadow-[6px_0_18px_rgb(15_23_42_/_14%)]"
            :style="{ width: `${sidebar.panelWidth.value}px` }"
          >
            <SidebarPanels
              ref="flyoutPanels"
              :editor="editor"
              :sidebar="sidebar"
              :panels="pluginSlots.panels"
              class="h-full"
            />
          </div>
          <div
            class="uf-flyout-resize absolute inset-y-0 z-40" :class="[RESIZE_HANDLE]"
            :style="{ left: `${sidebar.panelWidth.value}px` }"
            role="separator"
            aria-orientation="vertical"
            :aria-label="t('canvas.resizePanel')"
            @pointerdown="startPanelResize"
          >
            <span class="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-px opacity-70 group-hover:opacity-100" aria-hidden="true">
              <span class="size-[2px] rounded-full bg-current" />
              <span class="size-[2px] rounded-full bg-current" />
              <span class="size-[2px] rounded-full bg-current" />
            </span>
          </div>
        </template>
      </div>
    </div>
    <!-- Plugin-contributed free-floating layers (e.g. the AI chat window). -->
    <component :is="c" v-for="(c, i) in pluginSlots.overlays" :key="i" />
    <!-- The selected block's quick layout controls, floating next to it. -->
    <CanvasQuickPanel v-if="!editor.isPreviewMode.value" />
  </div>
</template>
