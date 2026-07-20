<script setup lang="ts">
import { computed } from 'vue'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui'
import { fontFamilyStack, isSystemFontValue, SYSTEM_FONT_STACKS } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { translatedOrFallback } from '@/vue/utils/translation-fallback'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  /** Offer a "Bind to field" action (only meaningful inside a BindableField). */
  bindable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'bind': []
}>()

const { t } = useUframeI18n()

// Selecting this sentinel opens the binding picker instead of setting a value.
const BIND = '__bind__'

const { editor } = useEditorContext()

// Registered families, split by where they load from.
const webOptions = computed(() =>
  editor.fonts.value.filter(font => font.provider !== 'local').map(font => ({ label: font.family, value: fontFamilyStack(font.family) })),
)
const installedOptions = computed(() =>
  editor.fonts.value.filter(font => font.provider === 'local').map(font => ({ label: font.family, value: fontFamilyStack(font.family) })),
)
const allOptions = computed(() => [...webOptions.value, ...installedOptions.value])

const current = computed(() => props.modelValue?.trim() ?? '')
const known = computed(() =>
  isSystemFontValue(current.value)
  || allOptions.value.some(option => option.value === current.value),
)

// Friendly name for a CSS font-family value: the registered family or system
// stack's label, else the first family in the stack, unquoted.
function labelFor(value: string): string {
  const v = value.trim()
  if (!v)
    return ''
  const font = allOptions.value.find(option => option.value === v)
  if (font)
    return font.label
  const system = SYSTEM_FONT_STACKS.find(stack => stack.value === v)
  if (system)
    return localizedSystemLabel(system)
  return v.split(',')[0]!.trim().replace(/^["']|["']$/g, '')
}

function localizedSystemLabel(stack: (typeof SYSTEM_FONT_STACKS)[number]): string {
  return translatedOrFallback(stack.labelKey, stack.label, t) ?? stack.label
}

const currentLabel = computed(() => labelFor(current.value))
// The placeholder carries the inherited/default font (a CSS stack) — show it as
// a clean family name, like other fields surface their inherited value.
const placeholderLabel = computed(() => labelFor(props.placeholder ?? '') || t('fontControl.placeholder'))

const model = computed<string>({
  get: () => current.value,
  set: (value) => {
    if (value === BIND)
      emit('bind')
    else
      emit('update:modelValue', value)
  },
})
</script>

<template>
  <Select v-model="model">
    <SelectTrigger class="w-full">
      <span v-if="currentLabel" class="truncate" :style="{ fontFamily: current }">{{ currentLabel }}</span>
      <span v-else class="truncate text-muted-foreground">{{ placeholderLabel }}</span>
    </SelectTrigger>
    <SelectContent>
      <!-- Preserve a typed/custom stack that matches no known option. -->
      <SelectGroup v-if="current && !known">
        <SelectItem :value="current">
          {{ current }}
        </SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel>{{ t('fontControl.system') }}</SelectLabel>
        <SelectItem v-for="stack in SYSTEM_FONT_STACKS" :key="stack.value" :value="stack.value">
          <span :style="{ fontFamily: stack.value }">{{ localizedSystemLabel(stack) }}</span>
        </SelectItem>
      </SelectGroup>

      <SelectGroup v-if="webOptions.length">
        <SelectLabel>{{ t('fontControl.web') }}</SelectLabel>
        <SelectItem v-for="option in webOptions" :key="option.value" :value="option.value">
          <span :style="{ fontFamily: option.value }">{{ option.label }}</span>
        </SelectItem>
      </SelectGroup>

      <SelectGroup v-if="installedOptions.length">
        <SelectLabel>{{ t('fontControl.installed') }}</SelectLabel>
        <SelectItem v-for="option in installedOptions" :key="option.value" :value="option.value">
          <span :style="{ fontFamily: option.value }">{{ option.label }}</span>
        </SelectItem>
      </SelectGroup>

      <template v-if="bindable">
        <div class="my-1 h-px bg-uf-border" role="separator" />
        <SelectItem :value="BIND">
          {{ t('fontControl.bind') }}
        </SelectItem>
      </template>
    </SelectContent>
  </Select>
</template>
