<script setup lang="ts">
import type { ColorFormat } from '@/components/ui/color-picker'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'
import { CHECKERBOARD_STYLE, ColorPicker, parseColor, toCssColor } from '@/components/ui/color-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  class?: string
  placeholder?: string
  /** Output/edit format of the popover picker. */
  format?: ColorFormat
  showAlpha?: boolean
  showEyeDropper?: boolean
  /** Reserve space for an action button overlaid at the field's right edge. */
  endAction?: boolean
}>(), {
  format: 'hex',
  showAlpha: true,
  showEyeDropper: true,
})

const model = defineModel<string>({ default: '' })
const { t } = useUframeI18n()

// Resolve the text value to a CSS colour for the swatch; `null` → bare
// checkerboard (empty / unparseable value).
const swatchCss = computed(() => {
  const parsed = parseColor(model.value ?? '')
  return parsed ? toCssColor(parsed) : null
})

function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}

// The picker edits the model live (so the user sees the colour applied while
// they tweak). Save just closes; Cancel restores the value captured when the
// popover opened.
const open = ref(false)
let valueOnOpen = ''

// reka only dismisses on a same-document outside click, so focusing the canvas
// iframe (or another window) wouldn't close the popover. Closing on window blur
// keeps the live-edited value (same as Save).
useEventListener(window, 'blur', () => {
  open.value = false
})

function onOpenChange(next: boolean) {
  if (next)
    valueOnOpen = model.value ?? ''
  open.value = next
}

function save() {
  open.value = false
}

function cancel() {
  model.value = valueOnOpen
  open.value = false
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <div
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
        :value="model"
        :placeholder="placeholder ?? '#000000'"
        @input="onInput"
      >
    </div>

    <!-- No floating close: there is no title row, and the ✕ would sit on top
         of the gradient area — the picker's own Save/Cancel dismiss it. -->
    <PopoverContent align="start" class="w-auto" hide-close>
      <ColorPicker
        v-model="model"
        :format="format"
        :show-alpha="showAlpha"
        :show-eye-dropper="showEyeDropper"
        show-actions
        @save="save"
        @cancel="cancel"
      />
    </PopoverContent>
  </Popover>
</template>
