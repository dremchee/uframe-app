<script setup lang="ts">
import type { BlockStyles } from '@/core'
import { computed } from 'vue'
import { CodeEditor, Tooltip } from '@/components/ui'
import {
  classKeyApplies,
  formatCss,
  serializeBlockStyles,
  serializeClassStyles,
  serializeStyleRules,
} from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const emit = defineEmits<{
  toggle: []
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()

const block = computed(() => editor.selectedBlock.value)
const document = computed(() => editor.effectiveDocument.value)

// Combine block-instance CSS + applied class CSS (singles + combos whose
// parts are all on the block). Mirrors the cascade the runtime emits, so
// reading top-to-bottom is what actually wins.
const css = computed(() => {
  const parts: string[] = []

  if (!block.value) {
    // Page selected — show the body rule (settings.style).
    const settingsStyle = document.value.settings.style
    if (settingsStyle && Object.keys(settingsStyle).length)
      parts.push(serializeStyleRules('body', settingsStyle))
    return formatCss(parts.join('\n'))
  }

  const blockClasses = block.value.classes ?? []
  const classSet = new Set(blockClasses)
  const appliedClassStyles: Record<string, BlockStyles> = {}
  for (const [key, value] of Object.entries(document.value.styles ?? {})) {
    if (classKeyApplies(key, classSet))
      appliedClassStyles[key] = value
  }
  const classCss = serializeClassStyles(appliedClassStyles)
  if (classCss)
    parts.push(formatCss(classCss))

  // The uf-block-<id> rule is the element's unnamed local layer — label it so
  // the machine selector doesn't read as an (uneditable) class. The comment is
  // emitted outside formatCss, whose {}/; tokenizer would glue it to the
  // following selector line.
  const blockCss = serializeBlockStyles(block.value)
  if (blockCss) {
    if (parts.length)
      parts.push('')
    parts.push(t('cssPreview.elementStylesComment'))
    parts.push(formatCss(blockCss))
  }

  return parts.join('\n')
})

const headerLabel = computed(() => {
  if (!block.value)
    return 'CSS · body'
  return `CSS · ${block.value.type}`
})
</script>

<template>
  <section class="uf-css-preview flex flex-col min-h-0 h-full overflow-hidden border-t border-uf-border bg-uf-panel">
    <Tooltip :text="t('cssPreview.toggleHint')">
      <div
        class="shrink-0 flex items-center h-8 px-3 text-[10px] uppercase tracking-wider font-semibold text-uf-muted border-b border-uf-border cursor-pointer select-none hover:bg-uf-panel-muted"
        @dblclick="emit('toggle')"
      >
        {{ headerLabel }}
      </div>
    </Tooltip>
    <div class="flex-1 min-h-0 overflow-auto p-2 scrollbar-hide">
      <CodeEditor
        v-if="css"
        :model-value="css"
        language="css"
        readonly
        hide-line-numbers
        :rows="6"
        class="border-0 shadow-none rounded-none bg-transparent"
      />
      <p v-else class="m-0 px-1 py-1 text-uf-muted italic text-[11px]">
        {{ t('cssPreview.noStyles') }}
      </p>
    </div>
  </section>
</template>
