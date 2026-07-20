<script setup lang="ts">
import type { BreakpointDef } from '@/core'
import type { BreakpointDraft } from '@/vue/components/BreakpointForm.vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { IconButton, Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { breakpointRangeLabel, DEFAULT_BREAKPOINTS } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { autoIconKey, breakpointIcon } from '@/vue/components/breakpoint-icons'
import BreakpointForm from '@/vue/components/BreakpointForm.vue'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

const props = defineProps<{
  breakpoint: BreakpointDef
  breakpoints: BreakpointDef[]
  /** Cross-highlight from the resolution track. */
  highlighted?: boolean
}>()

const emit = defineEmits<{
  update: [id: string, patch: Partial<Omit<BreakpointDef, 'id'>>]
  remove: [id: string]
  hover: [id: string | null]
}>()

const { t } = useUframeI18n()

const el = ref<HTMLElement | null>(null)
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(el)

const editOpen = ref(false)
const editDraft = ref<BreakpointDraft>({ label: '', direction: 'max', width: 0, icon: 'monitor' })
const editError = ref('')

function onEditOpenChange(open: boolean) {
  if (open) {
    const bp = props.breakpoint
    editDraft.value = {
      label: bp.label,
      direction: bp.direction,
      width: bp.width,
      widthMax: bp.widthMax,
      icon: bp.icon ?? autoIconKey(bp),
    }
    editError.value = ''
  }
  editOpen.value = open
}

function submitEdit() {
  const d = editDraft.value
  const isDuplicate = props.breakpoints.some(breakpoint =>
    breakpoint.id !== props.breakpoint.id
    && breakpoint.direction === d.direction
    && breakpoint.width === d.width
    && (breakpoint.direction !== 'between' || breakpoint.widthMax === d.widthMax),
  )
  if (isDuplicate) {
    editError.value = t('breakpoints.duplicateRange')
    return
  }
  emit('update', props.breakpoint.id, {
    label: d.label,
    direction: d.direction,
    width: d.width,
    widthMax: d.direction === 'between' ? d.widthMax : undefined,
    icon: d.icon,
  })
  editOpen.value = false
}

const deviceIcon = computed(() => breakpointIcon(props.breakpoint))

// A breakpoint is "custom" when its id isn't part of the built-in default set.
const isCustom = computed(() => !DEFAULT_BREAKPOINTS.some(d => d.id === props.breakpoint.id))

const widthLabel = computed(() => {
  return breakpointRangeLabel(props.breakpoint)
})
</script>

<template>
  <div
    ref="el"
    class="group flex items-center gap-1.5 rounded-md border bg-uf-panel shadow-xs pl-2 pr-1 h-9 transition-colors"
    :class="highlighted ? 'border-uf-accent bg-uf-accent/5' : 'border-uf-border'"
    @mouseenter="emit('hover', breakpoint.id)"
    @mouseleave="emit('hover', null)"
  >
    <span class="grid place-items-center shrink-0 size-5 text-uf-text">
      <component :is="deviceIcon" :size="13" :stroke-width="2" />
    </span>

    <span class="flex-1 min-w-0 truncate text-xs text-uf-text">{{ breakpointLabel(breakpoint, t) }}</span>
    <span
      v-if="isCustom"
      class="shrink-0 rounded bg-uf-accent/10 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-uf-accent"
    >{{ t('breakpoints.custom') }}</span>
    <span class="shrink-0 text-xs text-uf-muted tabular-nums">{{ widthLabel }}</span>

    <div class="flex items-center shrink-0">
      <Popover :open="editOpen" @update:open="onEditOpenChange">
        <PopoverTrigger as-child>
          <IconButton size="sm" :aria-label="t('breakpoints.editAria')">
            <Pencil :size="13" :stroke-width="1.75" />
          </IconButton>
        </PopoverTrigger>
        <PopoverContent
          class="w-64"
          :side="popoverSide"
          align="start"
          :reference="popoverReference"
          :title="t('breakpoints.editTitle')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="preventOverlayDismiss"
        >
          <BreakpointForm
            :model-value="editDraft"
            :error="editError"
            :submit-label="t('common.save')"
            @update:model-value="(value) => { editDraft = value; editError = '' }"
            @submit="submitEdit"
            @cancel="editOpen = false"
          />
        </PopoverContent>
      </Popover>

      <IconButton
        v-if="isCustom"
        size="sm"
        :aria-label="t('breakpoints.deleteAria')"
        @click="emit('remove', breakpoint.id)"
      >
        <Trash2 :size="13" :stroke-width="1.75" />
      </IconButton>
    </div>
  </div>
</template>
