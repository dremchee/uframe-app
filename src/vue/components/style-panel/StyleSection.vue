<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, useTemplateRef } from 'vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  /** Stable key for the persisted open state — never derived from the title. */
  id: string
  title: string
  /** Default open state — used until the user first toggles the section. */
  open?: boolean
  /** Show a marker dot when the section has any overridden style. */
  modified?: boolean
}>()

const detailsEl = useTemplateRef<HTMLDetailsElement>('detailsEl')

// Open state lives in the editor's persisted prefs (uf-editor → styleSections,
// keyed by section id), so a remount — switching elements, or the page ↔
// block target swap — restores the layout the user left instead of resetting
// to the defaults.
const { editor } = useEditorContext()
const { t } = useUframeI18n()
const isOpen = computed(() =>
  editor.storage.value.styleSections?.[props.id] ?? props.open ?? false,
)

function onToggle() {
  const open = detailsEl.value?.open ?? false
  if (open !== isOpen.value) {
    editor.storage.value.styleSections = {
      ...(editor.storage.value.styleSections ?? {}),
      [props.id]: open,
    }
  }
}
</script>

<template>
  <details
    ref="detailsEl"
    class="-mx-3 px-3 border-b border-uf-border last:border-b-0"
    :open="isOpen"
    @toggle="onToggle"
  >
    <!-- No horizontal padding: the title must sit flush with the field labels
         and controls below it. -->
    <summary
      class="py-3 text-xs font-bold uppercase tracking-[0.04em] text-uf-text cursor-pointer select-none list-none outline-none marker:content-[''] [&::-webkit-details-marker]:hidden"
    >
      <div class="flex items-center gap-2">
        <span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{{ title }}</span>
        <span
          v-if="modified"
          class="size-1.5 shrink-0 rounded-full bg-uf-accent"
          :title="t('style.sectionChanged')"
          :aria-label="t('style.sectionChanged')"
        />
        <span class="flex-1" />
        <ChevronRight
          class="text-uf-muted transition-transform"
          :class="isOpen && 'rotate-90'"
          :size="14"
          :stroke-width="2"
          aria-hidden="true"
        />
      </div>
    </summary>
    <div class="grid gap-2.5 pb-3">
      <slot />
    </div>
  </details>
</template>
