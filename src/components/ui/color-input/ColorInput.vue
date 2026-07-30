<script setup lang="ts">
import type { ColorFormat } from '@/components/ui/color-picker'
import { useEventListener } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { CHECKERBOARD_STYLE, ColorPicker, parseColor, toCssColor } from '@/components/ui/color-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  class?: string
  placeholder?: string
  /** Output/edit format of the popover picker. */
  format?: ColorFormat
  showAlpha?: boolean
  showEyeDropper?: boolean
  /** Concrete CSS colour used only to paint the swatch (e.g. a resolved variable). */
  swatch?: string
  /** Keep the model value for editing, but show the placeholder in the text
   * field. Used when the value is a CSS variable and the placeholder names it. */
  hideValue?: boolean
  /** Reserve space for an action button overlaid at the field's right edge. */
  endAction?: boolean
  /** Preferred picker direction. Collision handling may flip it when space is limited. */
  popoverSide?: 'top' | 'right' | 'bottom' | 'left'
}>(), {
  format: 'hex',
  showAlpha: true,
  showEyeDropper: true,
  popoverSide: 'bottom',
})

const model = defineModel<string>({ default: '' })
const { t } = useUframeI18n()
const field = useTemplateRef<HTMLElement>('field')
const { anchor, reference: popoverReference } = usePanelEdgePopover(field)
const resolvedPopoverSide = computed(() => anchor?.side ?? props.popoverSide)
// A picker update is emitted upward and may take a render cycle to round-trip
// through the style panel. Keep that draft visible in the input meanwhile.
const editedValue = shallowRef<string | null>(null)
const inputValue = computed(() => editedValue.value ?? (props.hideValue ? '' : model.value ?? ''))

// Resolve the text value to a CSS colour for the swatch; `null` → bare
// checkerboard (empty / unparseable value).
const swatchCss = computed(() => {
  const parsed = parseColor(editedValue.value ?? props.swatch ?? model.value ?? '')
  return parsed ? toCssColor(parsed) : null
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  editedValue.value = value
  model.value = value
}

// Keep local preview only for our own edit. A new upstream value (including a
// variable chosen from the binding menu) becomes the sole source of truth.
watch(model, (value) => {
  if (value !== editedValue.value)
    editedValue.value = null
})
watch(() => props.hideValue, (hidden) => {
  if (hidden)
    editedValue.value = null
})

// The picker edits the model live (so the user sees the colour applied while
// they tweak). Save just closes; Cancel restores the value captured when the
// popover opened.
const open = shallowRef(false)
const pickerColor = shallowRef('')
let valueOnOpen = ''

// reka only dismisses on a same-document outside click, so focusing the canvas
// iframe (or another window) wouldn't close the popover. Closing on window blur
// keeps the live-edited value (same as Save).
useEventListener(window, 'blur', () => {
  open.value = false
})

function onOpenChange(next: boolean) {
  if (next) {
    valueOnOpen = model.value ?? ''
    pickerColor.value = props.swatch ?? model.value ?? ''
  }
  open.value = next
}

function updatePickerColor(value: string) {
  pickerColor.value = value
  editedValue.value = value
  model.value = value
}

function save() {
  open.value = false
}

function cancel() {
  model.value = valueOnOpen
  pickerColor.value = valueOnOpen
  editedValue.value = null
  open.value = false
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <div
      ref="field"
      :class="cn(
        'uf-ui-color-input flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent py-1 pl-1.5 text-sm shadow-xs transition-colors',
        'focus-within:outline-none focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent',
        props.endAction ? 'pr-8' : 'pr-3',
        props.class,
      )"
    >
      <PopoverTrigger
        :aria-label="t('common.pickColor')"
        class="relative grid size-6 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-sm border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uf-accent"
      >
        <span class="absolute inset-0" :style="CHECKERBOARD_STYLE" />
        <span v-if="swatchCss" class="absolute inset-0" :style="{ backgroundColor: swatchCss }" />
      </PopoverTrigger>
      <input
        type="text"
        class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :value="inputValue"
        :placeholder="placeholder ?? '#000000'"
        @input="onInput"
      >
    </div>

    <PopoverContent
      align="start"
      class="w-auto"
      :collision-padding="6"
      :reference="popoverReference"
      :side="resolvedPopoverSide"
      :title="t('common.pickColor')"
    >
      <ColorPicker
        :model-value="pickerColor"
        :format="format"
        :show-alpha="showAlpha"
        :show-eye-dropper="showEyeDropper"
        show-actions
        @update:model-value="updatePickerColor"
        @save="save"
        @cancel="cancel"
      />
    </PopoverContent>
  </Popover>
</template>
