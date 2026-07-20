import type { Component } from 'vue'
import type { UframePlugin } from '@/core'
import type { PageEditorInstance, PluginSlots } from '@/vue/context/editor-context'
import { computed, reactive } from 'vue'
import {
  collectCanvasLayers,
  collectOverlays,
  collectPanels,
  collectSettingsSections,
  collectToolbarSlots,
  deepMergeRecord,
  mergeStyleTokens,
} from '@/core'

/**
 * Projects the editor's live plugin registry into the UI chrome and i18n
 * contributions. Keeping it reactive means runtime-loaded plugins appear
 * immediately without widening PageEditor's provider responsibility.
 */
export function useEditorPluginChrome(editor: PageEditorInstance) {
  const plugins = computed(() => editor.registeredPlugins.value as UframePlugin<Component>[])
  const styleTokens = computed(() => mergeStyleTokens(editor.registeredPlugins.value))

  const pluginMessages = computed(() => {
    const merged: Record<string, Record<string, unknown>> = {}
    for (const plugin of editor.registeredPlugins.value) {
      for (const [locale, messages] of Object.entries(plugin.messages ?? {}))
        merged[locale] = deepMergeRecord(merged[locale] ?? {}, messages ?? {})
    }
    return merged
  })

  const pluginSlots: PluginSlots = reactive({
    toolbarLeft: computed(() => collectToolbarSlots(plugins.value, 'left')),
    toolbarRight: computed(() => collectToolbarSlots(plugins.value, 'right')),
    panels: computed(() => collectPanels(plugins.value)),
    overlays: computed(() => collectOverlays(plugins.value)),
    canvasLayers: computed(() => collectCanvasLayers(plugins.value)),
    settingsSections: computed(() => collectSettingsSections(plugins.value)),
  })

  return { pluginMessages, pluginSlots, styleTokens }
}
