<script setup lang="ts">
import type { EditorTheme } from '@/vue/composables/editor/useEditorStorage'
import { Check, CircleAlert, Edit3, Eye, MonitorSmartphone, Moon, Sun, SunMoon } from '@lucide/vue'
import { computed } from 'vue'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, Tooltip } from '@/components/ui'
import { breakpointRangeLabel, breakpointUpperBound } from '@/core'
import { cn } from '@/lib/utils'
import { breakpointIcon } from '@/vue/components/breakpoint-icons'
import EditorExportMenu from '@/vue/components/EditorExportMenu.vue'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { breakpointLabel } from '@/vue/utils/breakpoint-label'

const { editor, lastSavedAt, autosaveError, pluginSlots, untrustedEmbeds } = useEditorContext()
const { t } = useUframeI18n()

// The base ("Responsive") layer plus every breakpoint — presets and custom —
// widest first, so the switcher can target any width the styles cover. Bound to
// the same setEditBreakpoint the properties-panel breakpoint selector drives.
const viewportOptions = computed(() => [
  { value: 'base', label: t('toolbar.viewportResponsive'), icon: MonitorSmartphone, hint: '' },
  ...editor.breakpoints.value
    .slice()
    .sort((a, b) => breakpointUpperBound(b) - breakpointUpperBound(a))
    .map(bp => ({ value: bp.id, label: breakpointLabel(bp, t), icon: breakpointIcon(bp), hint: breakpointRangeLabel(bp) })),
])

// The select's model: the edited breakpoint, or '' when a custom canvas width
// means no breakpoint is exactly current.
const selectedViewport = computed<string>({
  get: () => (editor.customWidth.value == null ? editor.editBreakpoint.value : ''),
  set: value => value && editor.setEditBreakpoint(value),
})
const activeViewportOption = computed(() =>
  viewportOptions.value.find(option => option.value === selectedViewport.value),
)

// Theme is a 3-way toggle: light → dark → system (follows the OS) → light.
const THEME_ORDER: EditorTheme[] = ['light', 'dark', 'system']
const THEME_LABEL = computed<Record<EditorTheme, string>>(() => ({
  light: t('toolbar.themeLight'),
  dark: t('toolbar.themeDark'),
  system: t('toolbar.themeSystem'),
}))
function cycleTheme() {
  const i = THEME_ORDER.indexOf(editor.storage.value.theme)
  editor.storage.value.theme = THEME_ORDER[(i + 1) % THEME_ORDER.length]!
}

const savedLabel = computed(() => {
  if (autosaveError.value)
    return t('toolbar.saveFailed')

  const ts = lastSavedAt.value
  if (!ts)
    return ''

  const diff = Date.now() - ts
  if (diff < 5_000)
    return t('toolbar.savedJustNow')
  if (diff < 60_000)
    return t('toolbar.savedSecondsAgo', { n: Math.floor(diff / 1000) })
  if (diff < 3_600_000)
    return t('toolbar.savedMinutesAgo', { n: Math.floor(diff / 60_000) })
  return t('toolbar.savedHoursAgo', { n: Math.floor(diff / 3_600_000) })
})
</script>

<template>
  <header class="relative shrink-0 z-10 flex items-center justify-between gap-4 min-h-14 px-4 py-2.5 border-b border-uf-border bg-uf-panel/95 backdrop-blur-md">
    <div class="flex items-center gap-2">
      <!-- Logo inlined so it ships with the library (no external asset). -->
      <svg viewBox="0 0 131 131" class="size-7 shrink-0" aria-hidden="true">
        <rect x="20" y="20" width="111" height="111" rx="25" fill="#1A0C67" />
        <rect width="111" height="111" rx="25" fill="#3E1BFA" />
        <path
          d="M26 57V33C26 29.134 29.134 26 33 26C36.866 26 40 29.134 40 33V57C40 65.2843 46.7157 72 55 72C63.2843 72 70 65.2843 70 57V33C70 29.134 73.134 26 77 26C80.866 26 84 29.134 84 33V57C84 73.0163 71.0163 86 55 86C38.9837 86 26 73.0163 26 57Z"
          fill="white"
        />
      </svg>
      <component :is="c" v-for="(c, i) in pluginSlots.toolbarLeft" :key="i" />
    </div>

    <div class="inline-flex items-center gap-2">
      <component :is="c" v-for="(c, i) in pluginSlots.toolbarRight" :key="i" />
      <span
        v-if="savedLabel"
        :class="cn(
          'inline-flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full text-[11px] font-medium tabular-nums',
          autosaveError ? 'bg-uf-danger/10 text-uf-danger' : 'bg-uf-accent/10 text-uf-accent',
        )"
      >
        <component :is="autosaveError ? CircleAlert : Check" :size="12" :stroke-width="2.25" class="shrink-0" />
        {{ savedLabel }}
      </span>
      <Select v-model="selectedViewport">
        <!-- Fixed width so the toolbar doesn't shift as the label changes
             length (Responsive → Mobile). -->
        <SelectTrigger class="h-9 w-40 gap-2" :aria-label="t('toolbar.viewport')">
          <div class="inline-flex items-center gap-2">
            <component :is="(activeViewportOption ?? viewportOptions[0]).icon" :size="15" :stroke-width="1.75" class="shrink-0" />
            <span class="truncate">{{ activeViewportOption?.label ?? t('toolbar.customViewport') }}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in viewportOptions" :key="option.value" :value="option.value">
            <span class="inline-flex w-full items-center gap-2">
              <component :is="option.icon" :size="15" :stroke-width="1.75" class="shrink-0" />
              <span>{{ option.label }}</span>
              <span v-if="option.hint" class="ml-auto pl-3 text-[11px] text-uf-muted tabular-nums">{{ option.hint }}</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <Tooltip :text="t('toolbar.theme', { name: THEME_LABEL[editor.storage.value.theme] })">
        <Button
          variant="outline"
          size="icon"
          type="button"
          :aria-label="t('toolbar.themeChange', { name: THEME_LABEL[editor.storage.value.theme] })"
          @click="cycleTheme"
        >
          <Sun v-if="editor.storage.value.theme === 'light'" />
          <Moon v-else-if="editor.storage.value.theme === 'dark'" />
          <SunMoon v-else />
        </Button>
      </Tooltip>
      <Tooltip :text="editor.isPreviewMode.value ? t('toolbar.edit') : t('toolbar.preview')">
        <Button
          variant="outline"
          size="icon"
          type="button"
          :aria-label="editor.isPreviewMode.value ? t('toolbar.edit') : t('toolbar.preview')"
          @click="editor.isPreviewMode.value = !editor.isPreviewMode.value"
        >
          <Edit3 v-if="editor.isPreviewMode.value" />
          <Eye v-else />
        </Button>
      </Tooltip>
      <EditorExportMenu :editor="editor" :untrusted-embeds="untrustedEmbeds" />
    </div>
  </header>
</template>
