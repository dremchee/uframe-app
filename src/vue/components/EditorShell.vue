<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui'
import CanvasViewport from '@/vue/components/CanvasViewport.vue'
import CssPreviewPanel from '@/vue/components/CssPreviewPanel.vue'
import EditorToolbar from '@/vue/components/EditorToolbar.vue'
import PagePreview from '@/vue/components/PagePreview.vue'
import PropertiesPanel from '@/vue/components/PropertiesPanel.vue'
import SidebarPanels from '@/vue/components/SidebarPanels.vue'
import SidebarRail from '@/vue/components/SidebarRail.vue'
import { useEditorShellLayout } from '@/vue/composables/ui/useEditorShellLayout'
import { useSidebar } from '@/vue/composables/ui/useSidebar'
import type { SidebarPanelAction } from '@/vue/composables/ui/useSidebar'
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

// A 1px divider line that is the resize handle: a wide invisible grab zone is
// painted by ::after (centred on the line). On hover/drag a ::before overlay
// thickens the line to 3px accent — drawn over the 1px footprint so the panel
// never resizes, matching ResizableHandle.
const RESIZE_HANDLE = 'z-20 w-px shrink-0 cursor-col-resize bg-uf-border transition-colors after:absolute after:z-20 after:inset-y-0 after:left-1/2 after:w-2.5 after:-translate-x-1/2 before:absolute before:z-20 before:inset-y-0 before:left-1/2 before:w-[3px] before:-translate-x-1/2 before:content-[""] before:bg-transparent before:transition-colors hover:before:bg-uf-accent'

const {
  startPanelResize,
  toggleCssPreview,
  cssPreviewCollapsedSize,
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
    class="uf-editor flex flex-col h-screen overflow-hidden bg-uf-bg text-uf-text font-pb text-sm leading-tight transition-colors duration-150"
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
    <div v-else class="flex flex-1 min-h-0">
      <SidebarRail
        class="uf-sidebar-rail"
        :mode="sidebar.pinned.value || sidebar.flyoutOpen.value ? sidebar.mode.value : null"
        :panels="pluginSlots.panels"
        :multi-page="editor.isMultiPage.value"
        @select="sidebar.selectMode"
      />
      <!-- Docked panel (pinned): a resizable column that pushes the canvas. The
           handle is the divider line itself (1px) with a wide invisible grab
           zone via ::after, so the panel needs no own right border. -->
      <template v-if="sidebar.pinned.value">
        <SidebarPanels
          ref="dockedPanels"
          :editor="editor"
          :sidebar="sidebar"
          :panels="pluginSlots.panels"
          class="shrink-0"
          :style="{ width: `${sidebar.panelWidth.value}px` }"
        />
        <div
          class="relative" :class="[RESIZE_HANDLE]"
          role="separator"
          aria-orientation="vertical"
          :aria-label="t('canvas.resizePanel')"
          @pointerdown="startPanelResize"
        />
      </template>
      <div class="relative flex-1 min-w-0 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          auto-save-id="uf-editor-shell-v2"
          class="h-full"
        >
          <ResizablePanel :default-size="73" :min-size="40">
            <main class="h-full min-w-0 min-h-0 overflow-hidden">
              <CanvasViewport />
            </main>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="27" :min-size="18" :max-size="50">
            <ResizablePanelGroup
              direction="vertical"
              auto-save-id="uf-properties-css-preview-v1"
              class="h-full"
            >
              <ResizablePanel :min-size="20">
                <PropertiesPanel />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                size-unit="px"
                :default-size="cssPreviewCollapsedSize"
                :min-size="cssPreviewCollapsedSize"
                :max-size="600"
              >
                <template #default="{ resize }">
                  <CssPreviewPanel @toggle="toggleCssPreview(resize)" />
                </template>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        <!-- Floating flyout (unpinned): overlays the canvas, dismissed on blur. -->
        <template v-if="!sidebar.pinned.value && sidebar.flyoutOpen.value">
          <div
            ref="flyoutRef"
            class="absolute inset-y-0 left-0 z-30 shadow-xl"
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
          />
        </template>
      </div>
    </div>
    <!-- Plugin-contributed free-floating layers (e.g. the AI chat window). -->
    <component :is="c" v-for="(c, i) in pluginSlots.overlays" :key="i" />
  </div>
</template>
