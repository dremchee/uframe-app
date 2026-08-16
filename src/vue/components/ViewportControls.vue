<script setup lang="ts">
import { Redo2, Ruler, ScanLine, Undo2 } from '@lucide/vue'
import { Button, Tooltip } from '@/components/ui'
import BreakpointSegmentControl from '@/vue/components/BreakpointSegmentControl.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{ rulerMode?: boolean }>()
const emit = defineEmits<{
  'addBreakpoint': []
  'update:rulerMode': [value: boolean]
}>()
const { editor } = useEditorContext()
const { t } = useUframeI18n()
function selectViewport(value: string) {
  editor.setEditBreakpoint(value)
}
</script>

<template>
  <section class="flex h-10 shrink-0 items-center justify-between border-b border-uf-border bg-uf-panel px-3" :aria-label="t('toolbar.viewport')">
    <div class="flex items-center gap-1" role="group" :aria-label="t('toolbar.history')">
      <Tooltip :text="t('toolbar.undo')">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-uf-muted"
          :aria-label="t('toolbar.undo')"
          :disabled="!editor.canUndo.value"
          @click="editor.undo()"
        >
          <Undo2 :size="15" :stroke-width="1.75" />
        </Button>
      </Tooltip>

      <Tooltip :text="t('toolbar.redo')">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-uf-muted"
          :aria-label="t('toolbar.redo')"
          :disabled="!editor.canRedo.value"
          @click="editor.redo()"
        >
          <Redo2 :size="15" :stroke-width="1.75" />
        </Button>
      </Tooltip>
    </div>
    <div class="flex items-center gap-2">
      <BreakpointSegmentControl
        compact
        :model-value="editor.editBreakpoint.value"
        :breakpoints="editor.breakpoints.value"
        @update:model-value="selectViewport"
        @add="emit('addBreakpoint')"
      />

      <Tooltip :text="editor.isCanvasResizeMode.value ? t('toolbar.resizeCanvasStop') : t('toolbar.resizeCanvas')">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-uf-muted" :class="[
            editor.isCanvasResizeMode.value && 'bg-uf-accent/10 text-uf-accent',
          ]"
          :aria-label="editor.isCanvasResizeMode.value ? t('toolbar.resizeCanvasStop') : t('toolbar.resizeCanvas')"
          :aria-pressed="editor.isCanvasResizeMode.value"
          @click="editor.setCanvasResizeMode(!editor.isCanvasResizeMode.value)"
        >
          <ScanLine :size="14" :stroke-width="1.75" />
        </Button>
      </Tooltip>

      <Tooltip :text="rulerMode ? t('toolbar.rulerHide') : t('toolbar.rulerShow')">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-uf-muted" :class="[
            rulerMode && 'bg-uf-accent/10 text-uf-accent',
          ]"
          :aria-label="rulerMode ? t('toolbar.rulerHide') : t('toolbar.rulerShow')"
          :aria-pressed="rulerMode"
          @click="emit('update:rulerMode', !rulerMode)"
        >
          <Ruler :size="14" :stroke-width="1.75" />
        </Button>
      </Tooltip>
    </div>
  </section>
</template>
