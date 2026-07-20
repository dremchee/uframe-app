<script setup lang="ts">
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { ScrollArea } from '@/components/ui'
import ClassLibraryEntries from '@/vue/components/ClassLibraryEntries.vue'
import ClassLibraryToolbar from '@/vue/components/ClassLibraryToolbar.vue'
import { useClassLibrary } from '@/vue/composables/style/useClassLibrary'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
}>()

const editor = props.editor
const { t } = useUframeI18n()

const {
  query,
  usageFilter,
  usageOf,
  visibleSingles,
  visibleCombos,
  editStyles,
  addOpen,
  addName,
  submitAdd,
  renameClass,
  deleteClass,
  isEmpty,
  noMatches,
} = useClassLibrary(editor)
</script>

<template>
  <section class="flex flex-col min-h-0 h-full overflow-hidden">
    <ClassLibraryToolbar
      v-model:query="query"
      v-model:usage-filter="usageFilter"
      v-model:add-open="addOpen"
      v-model:add-name="addName"
      @submit-add="submitAdd"
    />

    <ScrollArea class="flex-1 min-h-0 p-3">
      <p
        v-if="isEmpty"
        class="px-2 py-6 text-center text-[12px] text-uf-muted leading-snug"
      >
        {{ t('classes.empty') }}
      </p>

      <p
        v-else-if="noMatches"
        class="px-2 py-6 text-center text-[12px] text-uf-muted leading-snug"
      >
        {{ t('classes.noMatches') }}
      </p>

      <ClassLibraryEntries
        v-else
        :singles="visibleSingles"
        :combos="visibleCombos"
        :usage-of="usageOf"
        :edit-styles="editStyles"
        :rename-class="renameClass"
        :delete-class="deleteClass"
      />
    </ScrollArea>
  </section>
</template>
