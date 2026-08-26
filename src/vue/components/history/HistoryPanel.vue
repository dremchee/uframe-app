<script setup lang="ts">
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
}>()

const editor = props.editor
const { t } = useUframeI18n()

const actionKeys: Record<string, string> = {
  'Edit': 'history.edit',
  'Global defaults': 'history.globalDefaults',
  'Fonts': 'history.fonts',
  'AI edit': 'history.aiEdit',
  'Edit block': 'history.editBlock',
  'Page style': 'history.pageStyle',
  'Add block to component Slot': 'history.addBlockToSlot',
  'Add component to Slot': 'history.addComponentToSlot',
  'Rename page': 'history.renamePage',
  'Add block': 'history.addBlock',
  'Duplicate': 'history.duplicate',
  'Wrap in div': 'history.wrap',
  'Remove wrapper': 'history.removeWrapper',
  'Hide': 'history.hide',
  'Show': 'history.show',
  'Save component': 'history.saveComponent',
  'Insert component': 'history.insertComponent',
  'Detach component': 'history.detachComponent',
  'Edit component property': 'history.editComponentProperty',
  'Reset component property': 'history.resetComponentProperty',
  'Add component Slot': 'history.addComponentSlot',
  'Move block to component Slot': 'history.moveBlockToSlot',
  'Reset component Slot': 'history.resetComponentSlot',
  'Delete block': 'history.deleteBlock',
  'Move block': 'history.moveBlock',
  'Spacing': 'history.spacing',
  'Resize tracks': 'history.resizeTracks',
  'Resize gap': 'history.resizeGap',
}

function localizedHistoryLabel(label: string): string {
  if (label.startsWith('history.'))
    return t(label)
  if (label === 'Initial')
    return t('history.initial')
  return actionKeys[label] ? t(actionKeys[label]!) : label
}

// Localised date + time for each entry (e.g. "Jun 24, 14:32:05").
const stamp = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

// Newest first; keep the original index so a click can jump straight to it.
const rows = computed(() =>
  editor.historyEntries.value
    .map((entry, index) => ({
      index,
      label: localizedHistoryLabel(entry.label),
      time: entry.createdAt ? stamp.format(entry.createdAt) : '',
    }))
    .reverse(),
)
const cursor = computed(() => editor.historyCursor.value)

function go(index: number) {
  editor.goToHistory(index)
}
</script>

<template>
  <section class="flex flex-col min-h-0 h-full overflow-hidden">
    <ScrollArea class="flex-1 min-h-0">
      <ul class="p-1.5">
        <li v-for="row in rows" :key="row.index">
          <button
            type="button"
            :class="cn(
              'group flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] cursor-pointer transition-colors',
              row.index === cursor ? 'bg-uf-accent/10 text-uf-accent' : 'text-uf-text hover:bg-uf-panel-muted',
              row.index > cursor && 'text-uf-muted',
            )"
            :aria-current="row.index === cursor ? 'true' : undefined"
            @click="go(row.index)"
          >
            <span
              :class="cn(
                'mt-1.5 size-1.5 shrink-0 rounded-full',
                row.index === cursor ? 'bg-uf-accent' : row.index > cursor ? 'bg-uf-border-strong' : 'bg-uf-muted',
              )"
            />
            <span class="flex-1 min-w-0">
              <span class="block truncate">{{ row.label }}</span>
              <span class="block text-[11px] tabular-nums text-uf-muted">{{ row.time }}</span>
            </span>
          </button>
        </li>
      </ul>
    </ScrollArea>
  </section>
</template>
