<script setup lang="ts">
import type { Component } from 'vue'
import type { UframePanel } from '@/core'
import type { SidebarMode } from '@/vue/composables/editor/useEditorStorage'
import { Braces, Component as ComponentIcon, Files, History, Layers, Palette, Plus, Settings2 } from '@lucide/vue'
import { computed } from 'vue'
import { Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

export type { SidebarMode }

const props = defineProps<{
  // The visible panel's mode, or null when the panel is collapsed/closed — then
  // no rail item is highlighted.
  mode: string | null
  /** Plugin-contributed panels, appended after the built-in rail items. */
  panels?: UframePanel<Component>[]
  /** When true, prepend the Pages rail item (multi-page editing enabled). */
  multiPage?: boolean
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const { t } = useUframeI18n()

const items = computed(() => [
  ...(props.multiPage ? [{ value: 'pages', label: t('sidebar.pages'), icon: Files }] : []),
  { value: 'add', label: t('sidebar.add'), icon: Plus },
  { value: 'layers', label: t('sidebar.layers'), icon: Layers },
  { value: 'components', label: t('sidebar.components'), icon: ComponentIcon },
  { value: 'variables', label: t('sidebar.variables'), icon: Palette },
  { value: 'classes', label: t('sidebar.classes'), icon: Braces },
  { value: 'history', label: t('sidebar.history'), icon: History },
  { value: 'settings', label: t('sidebar.settings'), icon: Settings2 },
  ...(props.panels ?? []).map((p) => {
    const label = p.labelKey ? t(p.labelKey) : p.label
    return { value: p.id, label: label === p.labelKey ? p.label : label, icon: p.icon }
  }),
])

const btn = 'inline-flex items-center justify-center w-8 h-8 rounded-md bg-transparent text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text'
const btnActive = 'bg-uf-accent/12 text-uf-accent-strong hover:bg-uf-accent/12 hover:text-uf-accent-strong'
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 shrink-0 w-12 py-2 border-r border-uf-border bg-uf-panel"
    role="tablist"
    :aria-label="t('sidebar.panel')"
  >
    <Tooltip v-for="item in items" :key="item.value" :text="item.label" side="right">
      <button
        type="button"
        role="tab"
        :aria-selected="mode === item.value"
        :aria-label="item.label"
        :class="cn(btn, mode === item.value && btnActive)"
        @click="emit('select', item.value)"
      >
        <component :is="item.icon" :size="17" :stroke-width="1.75" />
      </button>
    </Tooltip>
  </div>
</template>
