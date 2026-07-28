<script setup lang="ts">
import type { CssUnitOption } from './units'
import { computed, shallowRef, watch } from 'vue'
import Input from '@/components/ui/input/Input.vue'
import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectValue from '@/components/ui/select/SelectValue.vue'
import { cn } from '@/lib/utils'
import { CSS_UNITS, formatLength, isKeywordUnit, isValidLengthInput, parseLength, sizeInputPlaceholder } from './units'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  placeholder?: string
  /** Initial unit (a CSS_UNITS value) used while the field is empty. */
  defaultUnit?: string
  units?: CssUnitOption[]
  /** Add a variable-binding action to the unit dropdown (emits `request-bind`). */
  bindable?: boolean
  /** Reject (don't commit) numbers below this — e.g. 0 for sizes that can't go negative. */
  min?: number
  class?: string
}>(), {
  defaultUnit: 'px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'request-bind': []
}>()

// Sentinel value for the unit dropdown's "Variable…" action — never committed as
// a real unit.
const BIND_UNIT = '__var__'

const unitOptions = computed(() => props.units ?? CSS_UNITS)

const number = shallowRef('')
const unit = shallowRef(props.defaultUnit)
const hasSelectedUnit = computed(() => unit.value !== '—')
const unitTriggerClass = computed(() => [
  !hasSelectedUnit.value && 'w-6 px-0 [&>span]:hidden',
].filter(Boolean).join(' '))

// Controlled from the outside: re-derive number/unit whenever the model changes.
// An empty value keeps the last chosen unit so the field still remembers it, and
// a bare number doesn't clobber a previously-selected unit.
watch(() => props.modelValue, (value) => {
  const parsed = parseLength(value)
  if (!parsed) {
    number.value = ''
    return
  }
  number.value = parsed.number
  if (parsed.unit)
    unit.value = parsed.unit
}, { immediate: true })

const isKeyword = computed(() => isKeywordUnit(unit.value))
const inputPlaceholder = computed(() => sizeInputPlaceholder(props.placeholder))

// Invalid when the typed number isn't a finite number, or falls below `min`
// (e.g. a negative grid track / gap). Empty clears and keyword units carry no
// number — both are fine.
const invalid = computed(() => !isValidLengthInput(number.value, unit.value, props.min))

// Never commit an invalid value — the field keeps showing it (flagged), but it
// doesn't reach the document.
function commit() {
  if (invalid.value)
    return
  emit('update:modelValue', formatLength(number.value, unit.value))
}

function onNumber(value: string | number) {
  number.value = String(value ?? '')
  commit()
}

function onUnit(value: unknown) {
  if (value == null)
    return
  if (value === BIND_UNIT) {
    emit('request-bind')
    return
  }
  unit.value = String(value)
  if (isKeywordUnit(unit.value))
    number.value = ''
  commit()
}
</script>

<template>
  <div :class="cn('uf-ui-size-input flex h-9 w-full min-w-0 items-center gap-0.5 rounded-md border border-input bg-transparent pr-1 shadow-xs transition-colors focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent', invalid && 'border-uf-danger ring-1 ring-uf-danger focus-within:border-uf-danger focus-within:ring-uf-danger', props.class)">
    <Input
      type="text"
      inputmode="decimal"
      class="flex-1 min-w-0 h-auto rounded-none border-0 shadow-none focus-visible:ring-0 pr-1"
      :placeholder="isKeyword ? '' : inputPlaceholder"
      :model-value="isKeyword ? '' : number"
      :disabled="isKeyword"
      :aria-invalid="invalid || undefined"
      @update:model-value="onNumber"
    />
    <Select v-if="unitOptions.length > 1 || bindable" :model-value="unit" @update:model-value="onUnit">
      <SelectTrigger
        class="h-6 min-w-6 w-auto shrink-0 gap-0 rounded-sm border-0 bg-transparent px-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-uf-muted shadow-none transition-colors hover:bg-uf-panel-muted hover:text-uf-text focus:outline-none focus:ring-0 focus-visible:ring-0 data-[state=open]:bg-uf-panel-muted data-[state=open]:text-uf-text [&>svg]:hidden"
        :class="unitTriggerClass"
        aria-label="Select unit"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent class="min-w-14">
        <SelectItem v-if="bindable" :value="BIND_UNIT" class="mb-0.5 text-uf-muted">
          var
        </SelectItem>
        <SelectItem v-for="option in unitOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    <span
      v-else-if="hasSelectedUnit"
      class="grid h-6 min-w-6 shrink-0 select-none place-items-center px-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-uf-muted"
    >
      {{ unit }}
    </span>
  </div>
</template>
