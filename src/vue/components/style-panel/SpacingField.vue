<script setup lang="ts">
import { Eraser } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { IconButton, Popover, PopoverContent, PopoverTrigger, SizeInput } from '@/components/ui'
import { formatLength, isKeywordUnit, parseLength } from '@/components/ui/size-input/units'
import { parseVarRef } from '@/core'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  // Direction the value grows when scrubbed — outward from the box centre:
  // top → up, bottom → down, left → left, right → right.
  dir?: 'up' | 'down' | 'left' | 'right'
  /** Popover header title, e.g. "Margin top" (see SpacingControl). */
  label?: string
}>(), {
  dir: 'up',
})

const emit = defineEmits<{
  'change': [value: string]
  'update:open': [value: boolean]
  'update:dragging': [value: boolean]
}>()
const { t } = useUframeI18n()

const horizontal = computed(() => props.dir === 'left' || props.dir === 'right')

// Controlled so we can force-close when focus leaves the window (a click into
// the canvas iframe, which reka's outside-click can't observe).
const open = ref(false)
// The value when the popover opened — Option/Alt+click on the trigger reverts to it.
const initialValue = ref('')
function onOpenChange(isOpen: boolean) {
  if (isOpen)
    initialValue.value = props.modelValue
  open.value = isOpen
  emit('update:open', isOpen)
}
useEventListener(window, 'blur', () => {
  if (open.value)
    onOpenChange(false)
})

// Focus (and select) the value input when the popover opens, instead of reka's
// default of focusing the first element (the clear button).
const sizeInput = useTemplateRef<{ $el: HTMLElement }>('sizeInput')
function onOpenAutoFocus(event: Event) {
  event.preventDefault()
  nextTick(() => {
    const input = sizeInput.value?.$el?.querySelector('input')
    input?.focus()
    input?.select()
  })
}

const view = computed(() => {
  const parsed = parseLength(props.modelValue)
  if (!parsed)
    return { number: '', unit: 'px' }
  return { number: parsed.number, unit: parsed.unit && parsed.unit !== '—' ? parsed.unit : 'px' }
})

const numeric = computed(() => Number(view.value.number) || 0)
const isZero = computed(() => !view.value.number || numeric.value === 0)
// A `var(--x)` binding can't be scrubbed or parsed as a length — the trigger
// shows a `var` marker and opens the popover (to rebind/detach) on click.
const isVar = computed(() => parseVarRef(props.modelValue) != null)
// Trigger text: `var` when bound, else the number or keyword (auto/none).
const display = computed(() =>
  isVar.value
    ? 'var'
    : view.value.number || (isKeywordUnit(view.value.unit) ? view.value.unit : '0'),
)

function setNumber(n: number) {
  emit('change', formatLength(String(Math.max(0, Math.round(n))), view.value.unit))
}

// Drag the box trigger vertically to scrub the value (1/px, ×10 with Shift). A
// press that doesn't move stays a click, which opens the popover; a drag sets
// `dragged` so the trailing click is swallowed and the popover doesn't open.
// Emits `update:dragging` so the parent can mirror the open-popover overlay
// behaviour (canvas spacing visualisation) during scrub too.
let dragged = false
function onPointerdown(event: PointerEvent) {
  // A bound value isn't scrubbable — let the click fall through to open the
  // popover, where the binding can be changed or detached.
  if (isVar.value)
    return
  // Option/Alt+click resets to the initial value without opening the popover.
  if (event.altKey) {
    emit('change', initialValue.value)
    dragged = true
    return
  }
  const el = event.currentTarget as HTMLElement
  const startX = event.clientX
  const startY = event.clientY
  const startNum = numeric.value
  dragged = false
  function move(e: PointerEvent) {
    // Each edge grows when dragged outward from the centre.
    const delta = props.dir === 'up'
      ? startY - e.clientY
      : props.dir === 'down'
        ? e.clientY - startY
        : props.dir === 'left'
          ? startX - e.clientX
          : e.clientX - startX
    if (!dragged) {
      if (Math.abs(delta) < 3)
        return
      dragged = true
      el.setPointerCapture(event.pointerId)
      emit('update:dragging', true)
    }
    setNumber(startNum + delta * (e.shiftKey ? 10 : 1))
  }
  function up() {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    if (dragged) {
      el.releasePointerCapture(event.pointerId)
      emit('update:dragging', false)
    }
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
}
function onClickCapture(event: MouseEvent) {
  if (!dragged)
    return
  event.preventDefault()
  event.stopImmediatePropagation()
  dragged = false
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverTrigger
      :class="cn(
        'inline-flex items-center justify-center w-9 h-6 rounded text-[12px] tabular-nums transition-colors hover:bg-black/5 data-[state=open]:bg-uf-panel data-[state=open]:ring-1 data-[state=open]:ring-uf-accent',
        isVar ? 'cursor-pointer' : horizontal ? 'cursor-ew-resize' : 'cursor-ns-resize',
        isVar ? 'font-mono text-[10px] text-uf-accent' : isZero ? 'text-uf-muted' : 'text-uf-text font-medium',
      )"
      @pointerdown="onPointerdown"
      @click.capture="onClickCapture"
    >
      {{ display }}
    </PopoverTrigger>
    <PopoverContent class="w-56" :title="label" @open-auto-focus="onOpenAutoFocus">
      <!-- Submitting on Enter closes the popover; the value is already applied
           on every keystroke via @update:model-value, so submit is purely the
           "I'm done" signal. -->
      <form class="flex items-center gap-2" @submit.prevent="onOpenChange(false)">
        <IconButton size="lg" :aria-label="t('style.clearAuto')" @click="emit('change', '')">
          <Eraser :size="15" :stroke-width="1.75" />
        </IconButton>
        <div class="flex-1 min-w-0">
          <BindableField
            type="size"
            :model-value="modelValue"
            @update:model-value="value => emit('change', value)"
          >
            <template #default="{ value, setValue, requestBind }">
              <SizeInput
                ref="sizeInput"
                bindable
                :model-value="value"
                placeholder="0"
                @request-bind="requestBind"
                @update:model-value="setValue"
              />
            </template>
          </BindableField>
        </div>
      </form>
    </PopoverContent>
  </Popover>
</template>
