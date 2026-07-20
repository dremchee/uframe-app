<script setup lang="ts">
import type { FontDef, FontProviderId, FontStyle } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { IconButton } from '@/components/ui'
import { fontFamilyStack } from '@/core'
import FontAddPopover from '@/vue/components/FontAddPopover.vue'
import FontEditPopover from '@/vue/components/FontEditPopover.vue'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
}>()

const { t } = useUframeI18n()
const providerLabel = computed<Record<FontProviderId, string>>(() => ({
  google: t('fonts.tagGoogle'),
  bunny: t('fonts.tagBunny'),
  custom: t('fonts.tagCustom'),
  local: t('fonts.tagLocal'),
}))

function removeFont(family: string) {
  const index = props.editor.fonts.value.findIndex(font => font.family === family)
  if (index >= 0)
    props.editor.removeFont(index)
}

function updateFont(index: number, font: FontDef) {
  props.editor.updateFont(index, font)
}

function faceSummary(weights?: number[], styles?: FontStyle[]): string {
  const values = weights?.length ? [...weights].sort((a, b) => a - b) : [400]
  const consecutive = values.every((weight, index) => index === 0 || weight === values[index - 1] + 100)
  const visibleWeights = consecutive && values.length > 2
    ? `${values[0]}…${values.at(-1)}`
    : values.join(' · ')
  return styles?.includes('italic') ? `${visibleWeights} · italic` : visibleWeights
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <FontAddPopover :editor="editor" />

    <div
      v-for="(font, index) in editor.fonts.value"
      :key="font.family"
      class="group flex items-center gap-1.5 rounded-md border border-uf-border bg-uf-panel shadow-xs pl-2.5 pr-1 h-9"
    >
      <span class="flex-1 min-w-0 truncate text-xs text-uf-text" :style="{ fontFamily: fontFamilyStack(font.family) }">{{ font.family }}</span>
      <span class="shrink-0 text-xs text-uf-muted tabular-nums">
        {{ providerLabel[font.provider] }}{{ font.provider === 'google' || font.provider === 'bunny' ? ` · ${faceSummary(font.weights, font.styles)}` : '' }}
      </span>
      <FontEditPopover :font="font" @update="updateFont(index, $event)" />
      <IconButton size="sm" :aria-label="t('fonts.removeAria')" @click="removeFont(font.family)">
        <Trash2 :size="13" :stroke-width="1.75" />
      </IconButton>
    </div>

    <p v-if="!editor.fonts.value.length" class="m-0 text-[11px] leading-snug text-uf-muted">
      {{ t('fonts.empty') }}
    </p>
  </div>
</template>
