<script setup lang="ts">
import { Monitor, Redo2, Ruler, ScanLine, Undo2 } from '@lucide/vue'
import { computed } from 'vue'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip } from '@/components/ui'
import BreakpointAddMenuItem from '@/vue/components/BreakpointAddMenuItem.vue'
import BreakpointSegmentControl from '@/vue/components/BreakpointSegmentControl.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const { editor } = useEditorContext()
const { t } = useUframeI18n()
defineProps<{ rulerMode?: boolean }>()
const emit = defineEmits<{
  addBreakpoint: []
  'update:rulerMode': [value: boolean]
}>()

const viewportOptions = computed(() => [
  { value: 'base', label: t('toolbar.viewportResponsive'), icon: Monitor },
  ...editor.breakpoints.value
    .map(breakpoint => ({
      value: breakpoint.id,
      label: breakpoint.label || breakpoint.id,
    })),
])

const activeOption = computed(() =>
  viewportOptions.value.find(option => option.value === editor.editBreakpoint.value),
)

const widthLabel = computed(() => {
  if (editor.customWidth.value != null || editor.canvasWidth.value != null)
    return `${editor.canvasWidth.value}px`
  return activeOption.value?.label ?? t('toolbar.customViewport')
})

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
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="subtle" size="sm" class="h-7 min-w-[104px] justify-between gap-1.5 px-2.5 text-[11px] font-medium tabular-nums" :aria-label="t('toolbar.viewport')">
            {{ widthLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="min-w-56">
          <DropdownMenuItem
            v-for="option in viewportOptions"
            :key="option.value"
            :class="option.value === editor.editBreakpoint.value ? 'bg-uf-panel-muted text-uf-accent' : ''"
            @select="selectViewport(option.value)"
          >
            <span class="flex-1">{{ option.label }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <BreakpointAddMenuItem @select="emit('addBreakpoint')" />
        </DropdownMenuContent>
      </DropdownMenu>

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
          :class="[
            'h-7 w-7 text-uf-muted',
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
          :class="[
            'h-7 w-7 text-uf-muted',
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
