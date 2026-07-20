<script setup lang="ts">
import type { CssUnitOption } from './units'
import { Link2, SlidersHorizontal } from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import { cn } from '@/lib/utils'
import Button from '../button/Button.vue'
import { InputGroup, InputGroupAddon, InputGroupButton } from '../input-group'
import Input from '../input/Input.vue'
import Label from '../label/Label.vue'
import Popover from '../popover/Popover.vue'
import PopoverContent from '../popover/PopoverContent.vue'
import PopoverTrigger from '../popover/PopoverTrigger.vue'
import Select from '../select/Select.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectValue from '../select/SelectValue.vue'
import FormulaValueField from './FormulaValueField.vue'
import { CSS_SIZING_UNITS, isCssExpression, isValidLengthInput, parseLength } from './units'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  placeholder?: string
  defaultUnit?: string
  /** Retained for callers migrating from the former number + unit control. */
  units?: CssUnitOption[]
  /** Values and formula types shown in the top preset row. */
  presets?: string[]
  bindable?: boolean
  min?: number
  class?: string
}>(), {
  defaultUnit: 'px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'request-bind': []
}>()

type FormulaKind = 'calc' | 'clamp' | 'minmax' | 'var'

const KEYWORDS = new Set([
  'auto',
  'none',
  'min-content',
  'max-content',
  'fit-content',
  'stretch',
  'subgrid',
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
])
const CSS_FUNCTIONS = new Set(['calc', 'minmax', 'clamp', 'var', 'fit-content'])
const DEFAULT_PRESETS = ['auto', 'min-content', 'max-content', 'calc', 'clamp', 'minmax']
const FORMULA_KINDS = new Set<FormulaKind>(['calc', 'clamp', 'minmax', 'var'])
const FORMULA_UNITS: CssUnitOption[] = [
  { value: 'px', label: 'px' },
  { value: 'fr', label: 'fr' },
  { value: '%', label: '%' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
  { value: 'vw', label: 'vw' },
  { value: 'vh', label: 'vh' },
]

const value = shallowRef('')
const popoverOpen = shallowRef(false)
const selectedPreset = shallowRef<string | null>(null)
const activeFormula = shallowRef<FormulaKind>('minmax')
const calcExpression = shallowRef('100% - 2rem')
const minValue = shallowRef('0px')
const preferredValue = shallowRef('2vw')
const maxValue = shallowRef('1fr')
const variableName = shallowRef('')

const supportedUnits = computed(() => new Set((props.units ?? CSS_SIZING_UNITS).map(option => option.value)))
const presetOptions = computed(() => props.presets ?? DEFAULT_PRESETS)
const selectedOption = computed(() => selectedPreset.value ?? activeFormula.value)
const rawValue = computed(() => value.value.trim())
const invalid = computed(() => !isValidCssSize(rawValue.value))
const formulaResult = computed(() => {
  if (selectedPreset.value)
    return selectedPreset.value

  switch (activeFormula.value) {
    case 'calc': return `calc(${calcExpression.value.trim()})`
    case 'clamp': return `clamp(${minValue.value.trim()}, ${preferredValue.value.trim()}, ${maxValue.value.trim()})`
    case 'minmax': return `minmax(${minValue.value.trim()}, ${maxValue.value.trim()})`
    case 'var': {
      const name = variableName.value.trim().replace(/^--/, '')
      return name ? `var(--${name})` : ''
    }
  }
  return ''
})
const canApplyFormula = computed(() => isValidCssSize(formulaResult.value))

watch(() => props.modelValue, (modelValue) => {
  value.value = String(modelValue ?? '').trim()
}, { immediate: true })

watch(popoverOpen, (isOpen) => {
  if (isOpen)
    hydrateFormula(rawValue.value)
})

function isValidCssSize(candidate: string): boolean {
  const raw = candidate.trim()
  if (!raw || KEYWORDS.has(raw))
    return true

  const functionName = raw.match(/^([a-z-]+)\s*\(/i)?.[1]?.toLowerCase()
  if (functionName)
    return CSS_FUNCTIONS.has(functionName) && isCssExpression(raw)

  const parsed = parseLength(raw)
  return Boolean(
    parsed
    && parsed.unit
    && supportedUnits.value.has(parsed.unit)
    && isValidLengthInput(parsed.number, parsed.unit, props.min),
  )
}

function commit(nextValue = value.value) {
  const next = nextValue.trim()
  value.value = nextValue
  if (isValidCssSize(next))
    emit('update:modelValue', next)
}

function selectPreset(preset: string) {
  const kind = formulaKindFromPreset(preset)
  if (kind) {
    selectedPreset.value = null
    activeFormula.value = kind
    return
  }
  selectedPreset.value = preset
}

function applyFormula() {
  if (!canApplyFormula.value)
    return
  commit(formulaResult.value)
  popoverOpen.value = false
}

function hydrateFormula(raw: string) {
  if (presetOptions.value.includes(raw) && !formulaKindFromPreset(raw)) {
    selectedPreset.value = raw
    return
  }

  selectedPreset.value = null
  const match = raw.match(/^([a-z-]+)\s*\((.*)\)$/i)
  const kind = match?.[1]?.toLowerCase() as FormulaKind | undefined
  const args = match?.[2]?.split(',').map(value => value.trim()) ?? []

  if (kind === 'calc') {
    activeFormula.value = kind
    calcExpression.value = match?.[2]?.trim() || '100% - 2rem'
  }
  else if (kind === 'clamp') {
    activeFormula.value = kind
    minValue.value = args[0] || '1rem'
    preferredValue.value = args[1] || '2vw'
    maxValue.value = args[2] || '3rem'
  }
  else if (kind === 'var') {
    activeFormula.value = kind
    variableName.value = (args[0] || '').replace(/^--/, '')
  }
  else {
    activeFormula.value = 'minmax'
    minValue.value = kind === 'minmax' ? args[0] || '0px' : '0px'
    maxValue.value = kind === 'minmax' ? args[1] || '1fr' : '1fr'
  }
}

function formulaKindFromPreset(preset: string): FormulaKind | undefined {
  const normalized = preset.trim().replace(/\(\)$/, '') as FormulaKind
  return FORMULA_KINDS.has(normalized) ? normalized : undefined
}

function presetLabel(preset: string): string {
  const kind = formulaKindFromPreset(preset)
  return kind ? `${kind}()` : preset
}
</script>

<template>
  <InputGroup
    :class="cn(
      'uf-ui-advanced-size-input',
      invalid && 'border-destructive ring-1 ring-destructive',
      props.class,
    )"
  >
    <Input
      :model-value="value"
      type="text"
      inputmode="text"
      :placeholder="placeholder ?? '1fr'"
      :aria-invalid="invalid || undefined"
      data-slot="input-group-control"
      class="h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-0"
      @update:model-value="value = String($event ?? '')"
      @blur="commit()"
      @keydown.enter.prevent="commit()"
    />

    <InputGroupAddon align="inline-end">
      <InputGroupButton v-if="bindable" aria-label="Bind to variable" @click="emit('request-bind')">
        <Link2 :size="14" :stroke-width="1.8" aria-hidden="true" />
      </InputGroupButton>

      <Popover v-model:open="popoverOpen">
        <PopoverTrigger as-child>
          <InputGroupButton aria-label="Edit sizing formula">
            <SlidersHorizontal :size="14" :stroke-width="1.8" aria-hidden="true" />
          </InputGroupButton>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          :side-offset="5"
          title="Edit sizing formula"
          body-class="p-0"
          class="w-64 overflow-hidden"
        >
          <div class="p-3">
            <Label>
              <span>Preset</span>
              <Select :model-value="selectedOption" @update:model-value="value => selectPreset(String(value))">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="preset in presetOptions" :key="preset" :value="preset">
                    {{ presetLabel(preset) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Label>

            <div v-if="!selectedPreset" class="mt-3 min-w-0">
              <template v-if="activeFormula === 'minmax'">
                <div class="grid gap-2">
                  <FormulaValueField v-model="minValue" label="Minimum" placeholder="0" :units="FORMULA_UNITS" />
                  <FormulaValueField v-model="maxValue" label="Maximum" placeholder="1" :units="FORMULA_UNITS" />
                </div>
              </template>

              <template v-else-if="activeFormula === 'clamp'">
                <div class="grid gap-2">
                  <FormulaValueField v-model="minValue" label="Minimum" placeholder="1" :units="FORMULA_UNITS" />
                  <FormulaValueField v-model="preferredValue" label="Preferred" placeholder="2" :units="FORMULA_UNITS" />
                  <FormulaValueField v-model="maxValue" label="Maximum" placeholder="3" :units="FORMULA_UNITS" />
                </div>
              </template>

              <template v-else-if="activeFormula === 'calc'">
                <Input v-model="calcExpression" class="h-8 font-mono text-xs" placeholder="100% - 2rem" />
              </template>

              <template v-else />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 px-3 py-2">
            <Button variant="outline" size="sm" @click="popoverOpen = false">
              Cancel
            </Button>
            <Button
              size="sm"
              :disabled="!canApplyFormula"
              @click="applyFormula"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </InputGroupAddon>
  </InputGroup>
</template>
