<script setup lang="ts">
import type { CssUnitOption } from './units'
import type { CssVariable } from '@/core'
import { ChevronDown, Ruler, SquareFunction } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { toVarRef } from '@/core'
import { cn } from '@/lib/utils'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'
import Button from '../button/Button.vue'
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
import Switch from '../switch/Switch.vue'
import Tooltip from '../tooltip/Tooltip.vue'
import FormulaValueField from './FormulaValueField.vue'
import {
  CSS_SIZING_UNITS,
  formatLength,
  isCssExpression,
  isKeywordUnit,
  isValidLengthInput,
  parseLength,
  sizeInputPlaceholder,
  UNITLESS,
} from './units'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  placeholder?: string
  defaultUnit?: string
  units?: CssUnitOption[]
  /** Values and formula types shown in the formula editor's preset row. */
  presets?: string[]
  bindable?: boolean
  variables?: CssVariable[]
  min?: number
  class?: string
}>(), {
  defaultUnit: 'px',
  variables: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type FormulaKind = 'calc' | 'clamp' | 'min' | 'max' | 'minmax' | 'var'
type PopoverMode = 'menu' | 'formula'
type CalcOperator = '+' | '-' | '*' | '/'

const { t } = useUframeI18n()

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
const CSS_FUNCTIONS = new Set(['calc', 'min', 'max', 'minmax', 'clamp', 'var', 'fit-content'])
const DEFAULT_PRESETS = ['auto', 'min-content', 'max-content', 'calc', 'clamp', 'min', 'max']
const FORMULA_KINDS = new Set<FormulaKind>(['calc', 'clamp', 'min', 'max', 'minmax', 'var'])
const CALC_OPERATORS: CalcOperator[] = ['+', '-', '*', '/']
const FORMULA_UNITS: CssUnitOption[] = [
  { value: 'px', label: 'px' },
  { value: 'fr', label: 'fr' },
  { value: '%', label: '%' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
  { value: 'vw', label: 'vw' },
  { value: 'vh', label: 'vh' },
]

const number = shallowRef('')
const unit = shallowRef(props.defaultUnit)
const expressionMode = shallowRef(false)
const popoverOpen = shallowRef(false)
const popoverMode = shallowRef<PopoverMode>('menu')
const showFormulaLine = shallowRef(false)
const unitTooltipOpen = shallowRef(false)
const advancedTooltipOpen = shallowRef(false)
const unitAction = useTemplateRef<HTMLElement>('unitAction')
const advancedAction = useTemplateRef<HTMLElement>('advancedAction')
const { anchor, reference: popoverReference } = usePanelEdgePopover(advancedAction)
const popoverSide = computed(() => anchor?.side ?? 'left')
const selectedPreset = shallowRef<string | null>(null)
const activeFormula = shallowRef<FormulaKind>('clamp')
const calcFirstValue = shallowRef('100%')
const calcOperator = shallowRef<CalcOperator>('-')
const calcSecondValue = shallowRef('2rem')
const minValue = shallowRef('0px')
const preferredValue = shallowRef('2vw')
const maxValue = shallowRef('1fr')
const variableName = shallowRef('')
const formulaInput = shallowRef('')

const unitOptions = computed(() => props.units ?? CSS_SIZING_UNITS)
const supportedUnits = computed(() => new Set(unitOptions.value.map(option => option.value)))
const hasSelectedUnit = computed(() => unit.value !== UNITLESS)
const isKeyword = computed(() => isKeywordUnit(unit.value))
const inputPlaceholder = computed(() => sizeInputPlaceholder(props.placeholder))
const rawValue = computed(() => expressionMode.value ? number.value.trim() : formatLength(number.value, unit.value))
const invalid = computed(() => expressionMode.value
  ? !isValidCssSize(rawValue.value)
  : !isValidLengthInput(number.value, unit.value, props.min))
const presetOptions = computed(() => {
  const options = [...(props.presets ?? DEFAULT_PRESETS)]
  if (unitOptions.value.some(option => option.value === 'fr') && !options.includes('minmax'))
    options.push('minmax')
  return options
})
const valueOptions = computed(() => presetOptions.value.filter(option => !formulaKindFromPreset(option)))
const functionOptions = computed<FormulaKind[]>(() => {
  const options: FormulaKind[] = ['calc', 'clamp', 'min', 'max']
  if (unitOptions.value.some(option => option.value === 'fr'))
    options.push('minmax')
  return options
})
const selectedFunction = computed<FormulaKind | undefined>(() => {
  const functionName = rawValue.value.match(/^([a-z-]+)\s*\(/i)?.[1]?.toLowerCase() as FormulaKind | undefined
  return functionName != null && functionOptions.value.includes(functionName) ? functionName : undefined
})
const hasSelectedFunction = computed(() => selectedFunction.value != null)
const selectedOption = computed(() => selectedPreset.value ?? activeFormula.value)
const formulaResult = computed(() => {
  if (selectedPreset.value)
    return selectedPreset.value

  switch (activeFormula.value) {
    case 'calc': {
      const first = calcFirstValue.value.trim()
      const second = calcSecondValue.value.trim()
      return first && second ? `calc(${first} ${calcOperator.value} ${second})` : ''
    }
    case 'clamp':
      return `clamp(${minValue.value.trim()}, ${preferredValue.value.trim()}, ${maxValue.value.trim()})`
    case 'min':
    case 'max':
      return `${activeFormula.value}(${minValue.value.trim()}, ${maxValue.value.trim()})`
    case 'minmax':
      return `minmax(${minValue.value.trim()}, ${maxValue.value.trim()})`
    case 'var': {
      const name = variableName.value.trim().replace(/^--/, '')
      return name ? `var(--${name})` : ''
    }
  }
  return ''
})
const canApplyFormula = computed(() => isValidCssSize(formulaInput.value))

watch(() => props.modelValue, syncFromModel, { immediate: true })

watch(popoverOpen, (isOpen) => {
  if (!isOpen)
    popoverMode.value = 'menu'
})

// The raw expression is a compact companion to the structured builder: edits
// in either surface are immediately reflected in the other whenever we can
// recognise the function and its arguments.
watch(formulaResult, (value) => {
  if (popoverMode.value === 'formula')
    formulaInput.value = value
})

useEventListener(window, 'blur', () => {
  popoverOpen.value = false
})

function syncFromModel(modelValue: string | number | undefined) {
  const raw = String(modelValue ?? '').trim()
  const parsed = parseLength(raw)

  if (!parsed) {
    number.value = ''
    expressionMode.value = false
    return
  }

  if (parsed.unit && supportedUnits.value.has(parsed.unit)) {
    number.value = parsed.number
    unit.value = parsed.unit
    expressionMode.value = false
    return
  }

  number.value = raw
  expressionMode.value = true
}

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

function emitIfValid(nextValue: string) {
  if (isValidCssSize(nextValue))
    emit('update:modelValue', nextValue)
}

function onNumber(nextValue: string | number) {
  const next = String(nextValue ?? '')
  number.value = next

  if (expressionMode.value) {
    const parsed = parseLength(next)
    if (parsed?.unit && supportedUnits.value.has(parsed.unit)) {
      number.value = parsed.number
      unit.value = parsed.unit
      expressionMode.value = false
    }
  }

  if (!invalid.value)
    emitIfValid(rawValue.value)
}

function onUnit(nextValue: unknown) {
  if (nextValue == null)
    return
  unit.value = String(nextValue)
  expressionMode.value = false
  if (isKeywordUnit(unit.value))
    number.value = ''
  if (!invalid.value)
    emitIfValid(rawValue.value)
}

function openAdvancedMenu() {
  closeActionTooltips()
  popoverMode.value = 'menu'
}

function openSelectedFunction() {
  const kind = selectedFunction.value
  if (!kind)
    return

  closeActionTooltips()
  selectFunction(kind)
  popoverOpen.value = true
}

function showUnitTooltip() {
  advancedTooltipOpen.value = false
  unitTooltipOpen.value = true
}

function showAdvancedTooltip() {
  unitTooltipOpen.value = false
  advancedTooltipOpen.value = true
}

function closeActionTooltips() {
  unitTooltipOpen.value = false
  advancedTooltipOpen.value = false
}

function closeMenuOnFocusOutside() {
  if (popoverMode.value !== 'menu')
    return

  popoverOpen.value = false
}

function selectVariable(key: string) {
  emit('update:modelValue', toVarRef(key))
  popoverOpen.value = false
}

function selectValue(value: string) {
  emit('update:modelValue', value)
  syncFromModel(value)
  popoverOpen.value = false
}

function switchToUnitInput() {
  if (!supportedUnits.value.has(unit.value))
    unit.value = props.defaultUnit
  number.value = ''
  expressionMode.value = false
  emit('update:modelValue', '')
  popoverOpen.value = false
}

function selectFunction(kind: FormulaKind) {
  selectedPreset.value = null
  activeFormula.value = kind
  hydrateSelectedFunction(kind)
  popoverMode.value = 'formula'
  formulaInput.value = formulaResult.value
}

function onCalcOperator(value: unknown) {
  if (CALC_OPERATORS.includes(value as CalcOperator))
    calcOperator.value = value as CalcOperator
}

function hydrateSelectedFunction(kind: FormulaKind) {
  const raw = rawValue.value
  const match = raw.match(/^([a-z-]+)\s*\((.*)\)$/i)
  if (match?.[1]?.toLowerCase() === kind) {
    hydrateFormula(raw)
    return
  }

  if (kind === 'calc') {
    calcFirstValue.value = '100%'
    calcOperator.value = '-'
    calcSecondValue.value = '2rem'
  }
  else if (kind === 'clamp') {
    minValue.value = '1rem'
    preferredValue.value = '2vw'
    maxValue.value = '3rem'
  }
  else {
    minValue.value = kind === 'minmax' ? '0px' : '1rem'
    maxValue.value = kind === 'minmax' ? '1fr' : '2rem'
  }
}

function selectPreset(preset: string) {
  const kind = formulaKindFromPreset(preset)
  if (kind) {
    selectedPreset.value = null
    activeFormula.value = kind
    hydrateSelectedFunction(kind)
    return
  }
  selectedPreset.value = preset
  formulaInput.value = formulaResult.value
}

function applyFormula() {
  if (!canApplyFormula.value)
    return
  emit('update:modelValue', formulaInput.value)
  syncFromModel(formulaInput.value)
  popoverOpen.value = false
}

function onFormulaInput(value: string | number) {
  const next = String(value ?? '')
  formulaInput.value = next

  if (isValidCssSize(next))
    hydrateFormula(next)
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
    const expression = match?.[2]?.trim() || '100% - 2rem'
    const parts = splitCalcExpression(expression)
    calcFirstValue.value = parts?.first ?? expression
    calcOperator.value = parts?.operator ?? '-'
    calcSecondValue.value = parts?.second ?? ''
  }
  else if (kind === 'clamp') {
    activeFormula.value = kind
    minValue.value = args[0] || '1rem'
    preferredValue.value = args[1] || '2vw'
    maxValue.value = args[2] || '3rem'
  }
  else if (kind === 'min' || kind === 'max' || kind === 'minmax') {
    activeFormula.value = kind
    minValue.value = args[0] || (kind === 'minmax' ? '0px' : '1rem')
    maxValue.value = args[1] || (kind === 'minmax' ? '1fr' : '2rem')
  }
  else if (kind === 'var') {
    activeFormula.value = kind
    variableName.value = (args[0] || '').replace(/^--/, '')
  }
}

function splitCalcExpression(expression: string): { first: string, operator: CalcOperator, second: string } | null {
  let depth = 0

  for (let index = 0; index < expression.length; index++) {
    const character = expression[index]
    if (character === '(') {
      depth++
      continue
    }
    if (character === ')') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth > 0 || index === 0 || !CALC_OPERATORS.includes(character as CalcOperator))
      continue

    const first = expression.slice(0, index).trim()
    const second = expression.slice(index + 1).trim()
    if (first && second)
      return { first, operator: character as CalcOperator, second }
  }

  return null
}

function formulaKindFromPreset(preset: string): FormulaKind | undefined {
  const normalized = preset.trim().replace(/\(\)$/, '') as FormulaKind
  return FORMULA_KINDS.has(normalized) ? normalized : undefined
}

function presetLabel(preset: string): string {
  const kind = formulaKindFromPreset(preset)
  return kind ? `${kind}()` : preset
}

function uiText(key: string, fallback: string): string {
  const translated = t(key)
  return translated === key ? fallback : translated
}
</script>

<template>
  <div
    :class="cn(
      'uf-ui-advanced-size-input flex h-9 w-full min-w-0 items-center gap-0.5 rounded-md border border-input bg-transparent pr-1 shadow-xs transition-colors focus-within:border-uf-accent focus-within:ring-1 focus-within:ring-uf-accent',
      invalid && 'border-uf-danger ring-1 ring-uf-danger focus-within:border-uf-danger focus-within:ring-uf-danger',
      props.class,
    )"
  >
    <Input
      type="text"
      :inputmode="expressionMode ? 'text' : 'decimal'"
      class="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent pr-1 shadow-none focus-visible:border-0 focus-visible:ring-0"
      :placeholder="isKeyword ? '' : inputPlaceholder"
      :model-value="isKeyword ? '' : number"
      :disabled="isKeyword"
      :aria-invalid="invalid || undefined"
      @click="openSelectedFunction"
      @update:model-value="onNumber"
    />

    <Select
      v-if="!expressionMode && (unitOptions.length > 1)"
      :model-value="unit"
      @update:model-value="onUnit"
    >
      <span
        ref="unitAction"
        class="inline-flex h-6 shrink-0"
        @mouseenter="showUnitTooltip"
        @mouseleave="unitTooltipOpen = false"
        @focusin="showUnitTooltip"
        @focusout="unitTooltipOpen = false"
      >
        <SelectTrigger
          class="h-6 min-w-6 w-auto shrink-0 gap-0 rounded-sm border-0 bg-transparent px-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-uf-muted shadow-none transition-colors hover:bg-uf-panel-muted hover:text-uf-text focus:outline-none focus:ring-0 focus-visible:ring-0 data-[state=open]:bg-uf-panel-muted data-[state=open]:text-uf-text [&>svg]:hidden"
          :class="!hasSelectedUnit ? 'w-6 px-0 [&>span]:hidden' : undefined"
          :aria-label="uiText('style.selectUnit', 'Select unit')"
          @click="closeActionTooltips"
        >
          <SelectValue />
        </SelectTrigger>
      </span>
      <SelectContent class="min-w-14">
        <SelectItem v-for="option in unitOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Tooltip
      manual
      :open="unitTooltipOpen"
      :reference="unitAction ?? undefined"
      :text="uiText('style.selectUnit', 'Select unit')"
    />

    <Popover v-model:open="popoverOpen">
      <span
        ref="advancedAction"
        class="inline-flex size-6 shrink-0"
        @mouseenter="showAdvancedTooltip"
        @mouseleave="advancedTooltipOpen = false"
        @focusin="showAdvancedTooltip"
        @focusout="advancedTooltipOpen = false"
      >
        <PopoverTrigger as-child>
          <button
            type="button"
            class="grid size-6 shrink-0 place-items-center rounded-sm border-0 bg-transparent p-0 text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent data-[state=open]:bg-uf-panel-muted data-[state=open]:text-uf-text"
            :aria-label="uiText('style.advancedValue', 'Variables and functions')"
            @click="openAdvancedMenu"
          >
            <SquareFunction
              v-if="hasSelectedFunction"
              class="size-4 shrink-0"
              :stroke-width="1.8"
              aria-hidden="true"
            />
            <ChevronDown v-else class="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </button>
        </PopoverTrigger>
      </span>

      <PopoverContent
        v-if="popoverMode === 'menu'"
        align="end"
        :side="popoverSide"
        :side-offset="5"
        :collision-padding="5"
        :reference="popoverReference"
        :title="uiText('style.advancedValue', 'Variables and functions')"
        body-class="p-0"
        class="w-72 overflow-hidden p-0"
        @focus-outside="closeMenuOnFocusOutside"
      >
        <div class="max-h-[min(32rem,calc(100dvh-6rem))] overflow-y-auto overscroll-contain">
          <section v-if="valueOptions.length">
            <div class="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
              {{ uiText('style.values', 'Values') }}
            </div>
            <div class="px-1.5 pb-1.5">
              <button
                v-for="valueOption in valueOptions"
                :key="valueOption"
                type="button"
                class="flex h-8 w-full appearance-none items-center rounded border-0 bg-transparent px-2 text-left text-xs text-uf-text transition-colors hover:bg-uf-panel-muted"
                @click="selectValue(valueOption)"
              >
                {{ valueOption }}
              </button>
            </div>
          </section>

          <section v-if="bindable" :class="valueOptions.length > 0 && 'border-t border-border'">
            <div class="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
              {{ t('style.variablesOfType', { type: 'size' }) }}
            </div>
            <div class="px-1.5 pb-1.5">
              <ul class="m-0 flex list-none flex-col gap-px p-0">
                <li v-for="variable in variables" :key="variable.key" class="contents">
                  <button
                    type="button"
                    class="flex h-8 w-full appearance-none items-center gap-2 rounded border-0 bg-transparent px-2 text-left text-xs transition-colors hover:bg-uf-panel-muted"
                    @click="selectVariable(variable.key)"
                  >
                    <span class="min-w-0 flex-1 truncate text-uf-text">{{ variable.name }}</span>
                    <span class="max-w-[45%] shrink-0 truncate font-mono text-[11px] text-uf-muted">{{ variable.value || '—' }}</span>
                  </button>
                </li>
              </ul>
              <p v-if="!variables.length" class="px-2 py-1 text-xs text-uf-muted">
                {{ uiText('style.noVariables', 'No matching variables yet.') }}
              </p>
            </div>
          </section>

          <section :class="(valueOptions.length > 0 || bindable) && 'border-t border-border'">
            <div class="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
              {{ uiText('style.functions', 'Functions') }}
            </div>
            <div class="px-1.5 pb-1.5">
              <button
                v-if="expressionMode"
                type="button"
                class="flex h-8 w-full appearance-none items-center gap-2 rounded border-0 bg-transparent px-2 text-left text-xs transition-colors hover:bg-uf-panel-muted"
                @click="switchToUnitInput"
              >
                <Ruler class="shrink-0 text-uf-muted" :size="14" :stroke-width="1.8" aria-hidden="true" />
                <span class="text-uf-text">{{ uiText('style.unitValue', 'Unit value') }}</span>
              </button>
              <button
                v-for="kind in functionOptions"
                :key="kind"
                type="button"
                class="flex h-8 w-full appearance-none items-center gap-2 rounded border-0 bg-transparent px-2 text-left text-xs transition-colors hover:bg-uf-panel-muted"
                @click="selectFunction(kind)"
              >
                <SquareFunction class="shrink-0 text-uf-muted" :size="14" :stroke-width="1.8" aria-hidden="true" />
                <span class="text-uf-text">{{ kind }}()</span>
              </button>
            </div>
          </section>
        </div>
      </PopoverContent>

      <PopoverContent
        v-else
        align="end"
        :side="popoverSide"
        :side-offset="5"
        :collision-padding="5"
        :reference="popoverReference"
        :title="uiText('style.editSizingFormula', 'Edit sizing formula')"
        body-class="p-0"
        class="w-64 overflow-hidden"
      >
        <div class="p-3">
          <Input
            v-if="showFormulaLine"
            type="text"
            class="font-mono text-sm"
            :model-value="formulaInput"
            :aria-label="uiText('style.editSizingFormula', 'Edit sizing formula')"
            @update:model-value="onFormulaInput"
          />

          <template v-else>
            <Label>
              <span>{{ uiText('style.preset', 'Preset') }}</span>
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
              <div v-if="activeFormula === 'minmax' || activeFormula === 'min' || activeFormula === 'max'" class="grid gap-2">
                <FormulaValueField v-model="minValue" :label="uiText('style.firstValue', 'First value')" placeholder="0" :units="FORMULA_UNITS" />
                <FormulaValueField v-model="maxValue" :label="uiText('style.secondValue', 'Second value')" placeholder="1" :units="FORMULA_UNITS" />
              </div>

              <div v-else-if="activeFormula === 'clamp'" class="grid gap-2">
                <FormulaValueField v-model="minValue" :label="uiText('style.minimum', 'Minimum')" placeholder="1" :units="FORMULA_UNITS" />
                <FormulaValueField v-model="preferredValue" :label="uiText('style.preferred', 'Preferred')" placeholder="2" :units="FORMULA_UNITS" />
                <FormulaValueField v-model="maxValue" :label="uiText('style.maximum', 'Maximum')" placeholder="3" :units="FORMULA_UNITS" />
              </div>

              <div v-else-if="activeFormula === 'calc'" class="grid gap-2">
                <FormulaValueField
                  v-model="calcFirstValue"
                  :label="uiText('style.firstValue', 'First value')"
                  placeholder="100"
                  :units="FORMULA_UNITS"
                />
                <Label>
                  <span>{{ uiText('style.operator', 'Operator') }}</span>
                  <Select :model-value="calcOperator" @update:model-value="onCalcOperator">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="operator in CALC_OPERATORS" :key="operator" :value="operator">
                        {{ operator }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                <FormulaValueField
                  v-model="calcSecondValue"
                  :label="uiText('style.secondValue', 'Second value')"
                  placeholder="2"
                  :units="FORMULA_UNITS"
                />
              </div>
            </div>
          </template>
        </div>

        <div class="px-3 py-2">
          <Switch v-model="showFormulaLine">
            {{ uiText('style.formulaLine', 'Single line') }}
          </Switch>
        </div>
        <div class="flex items-center justify-end gap-2 px-3 py-2">
          <Button variant="outline" size="sm" @click="popoverOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button size="sm" :disabled="!canApplyFormula" @click="applyFormula">
            {{ t('common.apply') }}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    <Tooltip
      manual
      :open="advancedTooltipOpen"
      :reference="advancedAction ?? undefined"
      :text="uiText('style.advancedValue', 'Variables and functions')"
    />
  </div>
</template>
