<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui'
import { mergeStyles } from '@/core'
import StyleSection from '@/vue/components/style-panel/StyleSection.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { anchorNameForBlock } from './anchor-css'
import AnchorPlacementControl from './AnchorPlacementControl.vue'
import AnchorSourceControl from './AnchorSourceControl.vue'
import AnchorTargetControl from './AnchorTargetControl.vue'
import { useAnchorCandidates } from './useAnchorCandidates'

const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()
const selectedBlock = computed(() => editor.selectedBlock.value)
const selectedBlockId = computed(() => selectedBlock.value?.id)
const suggestedName = computed(() => anchorNameForBlock(selectedBlockId.value ?? 'element'))
const { candidates } = useAnchorCandidates(editor, selectedBlockId, t)
const supported = typeof CSS === 'undefined'
  || (CSS.supports('anchor-name', '--anchor') && CSS.supports('position-area', 'top'))
const anchorKeys: Array<keyof BaseBlockStyles> = [
  'anchorName',
  'anchorScope',
  'positionAnchor',
  'positionArea',
  'positionTryFallbacks',
  'positionTryOrder',
  'positionVisibility',
]
const modified = computed(() => anchorKeys.some(key => props.modelValue[key] !== undefined))

function update(patch: Partial<BaseBlockStyles>) {
  emit('update:modelValue', mergeStyles(props.modelValue, patch))
}
</script>

<template>
  <StyleSection
    v-if="selectedBlock"
    id="css-anchor"
    :title="t('cssAnchor.title')"
    :modified="modified"
  >
    <Alert v-if="!supported">
      <AlertTitle>{{ t('cssAnchor.unsupportedTitle') }}</AlertTitle>
      <AlertDescription>{{ t('cssAnchor.unsupportedDescription') }}</AlertDescription>
    </Alert>

    <AnchorSourceControl :model-value="modelValue" :suggested-name="suggestedName" @update="update" />
    <div class="h-px bg-uf-border" aria-hidden="true" />
    <AnchorTargetControl :model-value="modelValue" :candidates="candidates" @update="update" />
    <AnchorPlacementControl v-if="modelValue.positionAnchor" :model-value="modelValue" @update="update" />
  </StyleSection>
</template>
