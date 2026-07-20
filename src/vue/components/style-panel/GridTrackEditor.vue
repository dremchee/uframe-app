<script setup lang="ts">
import type { CssUnitOption } from '@/components/ui/size-input/units'
import type { BaseBlockStyles, GridTrack } from '@/core'
import { List, Maximize2, Plus, Repeat2, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { AdvancedSizeInput, Input, NumberField, NumberFieldContent, NumberFieldInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SizeInput, Tabs, TabsList, TabsTrigger, Tooltip } from '@/components/ui'
import { appendListItem, makeEqualTracks, mergeStyles, parseGridTemplate, removeListItem, replaceListItem, serializeGridTemplate, serializeTrackList } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import StyleField from './StyleField.vue'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

type Axis = 'columns' | 'rows'
type Mode = 'tracks' | 'repeat' | 'auto'
interface AutoState { repeat: 'auto-fit' | 'auto-fill', min: string, max: string }
interface RepeatState { count: number, pattern: string }

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()
const TRACK_UNITS: CssUnitOption[] = [
  { value: 'fr', label: 'fr' },
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
  { value: 'auto', label: 'auto', keyword: true },
]
const MIN_UNITS: CssUnitOption[] = [
  { value: 'px', label: 'px' },
  { value: 'rem', label: 'rem' },
  { value: 'em', label: 'em' },
  { value: '%', label: '%' },
  { value: 'auto', label: 'auto', keyword: true },
]
const AXIS_KEY: Record<Axis, 'gridTemplateColumns' | 'gridTemplateRows'> = {
  columns: 'gridTemplateColumns',
  rows: 'gridTemplateRows',
}
const REPEAT_OPTIONS = ['auto-fit', 'auto-fill']
const PRESETS = [1, 2, 3, 4]
const presetBtn = 'inline-flex items-center justify-center size-5 rounded-sm text-[11px] text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text'
const removeBtn = 'inline-flex items-center justify-center size-6 shrink-0 rounded-sm text-uf-muted cursor-pointer transition-colors hover:bg-uf-danger/10 hover:text-uf-danger'
const addBtn = 'inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text'

const columns = ref<GridTrack[]>([])
const rows = ref<GridTrack[]>([])
const colMode = ref<Mode>('tracks')
const rowMode = ref<Mode>('tracks')
const defaultAuto = (): AutoState => ({ repeat: 'auto-fit', min: '240px', max: '1fr' })
const colAuto = ref<AutoState>(defaultAuto())
const rowAuto = ref<AutoState>(defaultAuto())
const defaultRepeat = (): RepeatState => ({ count: 2, pattern: 'minmax(0, 1fr)' })
const colRepeat = ref<RepeatState>(defaultRepeat())
const rowRepeat = ref<RepeatState>(defaultRepeat())

function update(patch: Partial<BaseBlockStyles>) {
  emit('update:modelValue', mergeStyles(styles.value, patch))
}

function tracksOf(axis: Axis) {
  return axis === 'columns' ? columns : rows
}

function modeOf(axis: Axis) {
  return axis === 'columns' ? colMode : rowMode
}

function autoOf(axis: Axis) {
  return axis === 'columns' ? colAuto : rowAuto
}

function repeatOf(axis: Axis) {
  return axis === 'columns' ? colRepeat : rowRepeat
}

function serializeAxis(axis: Axis): string {
  if (modeOf(axis).value === 'auto')
    return serializeGridTemplate({ mode: 'auto', ...autoOf(axis).value })
  if (modeOf(axis).value === 'repeat')
    return serializeGridTemplate({ mode: 'repeat', ...repeatOf(axis).value })
  return serializeTrackList(tracksOf(axis).value)
}

function syncAxis(axis: Axis, value: string | undefined) {
  if (serializeAxis(axis) === (value ?? ''))
    return
  const template = parseGridTemplate(value)
  if (template.mode === 'auto') {
    modeOf(axis).value = 'auto'
    autoOf(axis).value = { repeat: template.repeat, min: template.min, max: template.max }
  }
  else if (template.mode === 'repeat') {
    modeOf(axis).value = 'repeat'
    repeatOf(axis).value = { count: template.count, pattern: template.pattern }
  }
  else {
    modeOf(axis).value = 'tracks'
    tracksOf(axis).value = template.tracks
  }
}

watch(() => styles.value.gridTemplateColumns, value => syncAxis('columns', value), { immediate: true })
watch(() => styles.value.gridTemplateRows, value => syncAxis('rows', value), { immediate: true })

function commitAxis(axis: Axis) {
  update({ [AXIS_KEY[axis]]: serializeAxis(axis) || undefined })
}

function setMode(axis: Axis, mode: Mode) {
  if (modeOf(axis).value === mode)
    return
  modeOf(axis).value = mode
  if (mode === 'tracks' && tracksOf(axis).value.length === 0)
    tracksOf(axis).value = makeEqualTracks(3)
  commitAxis(axis)
}

function setAuto(axis: Axis, patch: Partial<AutoState>) {
  autoOf(axis).value = { ...autoOf(axis).value, ...patch }
  commitAxis(axis)
}

function setRepeat(axis: Axis, patch: Partial<RepeatState>) {
  repeatOf(axis).value = { ...repeatOf(axis).value, ...patch }
  commitAxis(axis)
}

function setTrack(axis: Axis, index: number, size: string) {
  const list = tracksOf(axis)
  list.value = replaceListItem(list.value, index, { size })
  commitAxis(axis)
}

function addTrack(axis: Axis) {
  const list = tracksOf(axis)
  list.value = appendListItem(list.value, { size: '1fr' })
  commitAxis(axis)
}

function removeTrack(axis: Axis, index: number) {
  const list = tracksOf(axis)
  list.value = removeListItem(list.value, index)
  commitAxis(axis)
}

function applyPreset(axis: Axis, count: number) {
  tracksOf(axis).value = makeEqualTracks(count)
  commitAxis(axis)
}
</script>

<template>
  <StyleField
    v-for="axis in (['columns', 'rows'] as Axis[])"
    :key="axis"
    :label="axis === 'columns' ? t('style.columns') : t('style.rows')"
    :field="AXIS_KEY[axis]"
  >
    <div class="grid gap-1.5">
      <Tabs :model-value="modeOf(axis).value" @update:model-value="(value: string | number) => setMode(axis, value as Mode)">
        <TabsList class="grid-cols-3">
          <Tooltip :text="t('style.tracks')">
            <TabsTrigger value="tracks" class="min-h-7" :aria-label="t('style.tracks')">
              <List :size="14" :stroke-width="1.8" />
            </TabsTrigger>
          </Tooltip>
          <Tooltip :text="t('style.repeat')">
            <TabsTrigger value="repeat" class="min-h-7" :aria-label="t('style.repeat')">
              <Repeat2 :size="14" :stroke-width="1.8" />
            </TabsTrigger>
          </Tooltip>
          <Tooltip :text="t('style.auto')">
            <TabsTrigger value="auto" class="min-h-7" :aria-label="t('style.auto')">
              <Maximize2 :size="14" :stroke-width="1.8" />
            </TabsTrigger>
          </Tooltip>
        </TabsList>
      </Tabs>

      <template v-if="modeOf(axis).value === 'tracks'">
        <div v-for="(track, index) in tracksOf(axis).value" :key="index" class="flex items-center gap-1">
          <span class="w-4 shrink-0 text-[10px] text-uf-muted tabular-nums text-center">{{ index + 1 }}</span>
          <div class="min-w-0 flex-1">
            <BindableField
              type="size"
              :model-value="track.size"
              @update:model-value="(value: string) => setTrack(axis, index, value)"
            >
              <template #default="{ value, setValue, requestBind }">
                <AdvancedSizeInput
                  bindable
                  :units="TRACK_UNITS"
                  default-unit="fr"
                  placeholder="1fr"
                  :min="0"
                  :model-value="value"
                  @request-bind="requestBind"
                  @update:model-value="setValue"
                />
              </template>
            </BindableField>
          </div>
          <button
            type="button"
            :class="removeBtn"
            :aria-label="t('style.removeTrack', { axis: axis === 'columns' ? t('style.column') : t('style.row'), n: index + 1 })"
            @click="removeTrack(axis, index)"
          >
            <X :size="13" :stroke-width="1.75" />
          </button>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" :class="addBtn" @click="addTrack(axis)">
            <Plus :size="13" :stroke-width="2" />
            {{ t('style.addTrack', { axis: axis === 'columns' ? t('style.column') : t('style.row') }) }}
          </button>
          <div class="ml-auto flex items-center gap-0.5">
            <button
              v-for="count in PRESETS"
              :key="count"
              type="button"
              :class="presetBtn"
              :aria-label="t('style.equalTracks', { n: count, axis: axis === 'columns' ? t('style.columns') : t('style.rows') })"
              @click="applyPreset(axis, count)"
            >
              {{ count }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="modeOf(axis).value === 'repeat'">
        <div class="grid grid-cols-[7rem_minmax(0,1fr)] gap-1.5">
          <StyleField :label="t('style.count')">
            <NumberField
              :model-value="repeatOf(axis).value.count"
              :min="1"
              :step="1"
              @update:model-value="value => setRepeat(axis, { count: Math.max(1, Math.round(value)) })"
            >
              <NumberFieldContent>
                <NumberFieldInput />
              </NumberFieldContent>
            </NumberField>
          </StyleField>
          <StyleField :label="t('style.track')">
            <Input
              :model-value="repeatOf(axis).value.pattern"
              placeholder="minmax(0, 1fr)"
              @update:model-value="value => setRepeat(axis, { pattern: String(value) })"
            />
          </StyleField>
        </div>
      </template>

      <template v-else>
        <StyleField :label="t('style.repeat')">
          <Select :model-value="autoOf(axis).value.repeat" @update:model-value="value => setAuto(axis, { repeat: value as AutoState['repeat'] })">
            <SelectTrigger><SelectValue placeholder="auto-fit" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in REPEAT_OPTIONS" :key="option" :value="option">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
        </StyleField>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
          <StyleField :label="t('style.min')">
            <SizeInput
              :units="MIN_UNITS"
              default-unit="px"
              placeholder="240px"
              :min="0"
              :model-value="autoOf(axis).value.min"
              @update:model-value="(value: string) => setAuto(axis, { min: value })"
            />
          </StyleField>
          <StyleField :label="t('style.max')">
            <SizeInput
              :units="TRACK_UNITS"
              default-unit="fr"
              placeholder="1fr"
              :min="0"
              :model-value="autoOf(axis).value.max"
              @update:model-value="(value: string) => setAuto(axis, { max: value })"
            />
          </StyleField>
        </div>
      </template>
    </div>
  </StyleField>
</template>
