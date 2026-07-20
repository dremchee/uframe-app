import type { Component } from 'vue'
import { definePlugin } from '@/core'
import AiCanvasRing from './AiCanvasRing.vue'
import AiChatWindow from './AiChatWindow.vue'
import AiSettingsSection from './AiSettingsSection.vue'
import AiToolbarButton from './AiToolbarButton.vue'
import { aiMessages } from './messages'

/**
 * Official AI plugin: adds a toolbar toggle, a floating chat window, an
 * in-canvas "generating" ring and an AI section in the Settings panel. Register
 * it via `<PageEditor :plugins="[aiPlugin]" />`. Reads/writes its config on the
 * editor's local storage (`aiApiKey` / `aiModel` / …) and drives generation
 * through the exported `generateBlocks` helper.
 */
export const aiPlugin = definePlugin<Component>({
  name: 'ai',
  messages: aiMessages,
  toolbarSlots: { right: [AiToolbarButton] },
  overlays: [AiChatWindow],
  canvasLayers: [AiCanvasRing],
  settingsSections: [AiSettingsSection],
})

export default aiPlugin

// Logic surface, re-exported for hosts that want to call generation directly.
export * from './generateBlocks'
export * from './listModels'
export * from './presets'
export * from './template-spec'
export { loading, toggleAiChat, useAiChat } from './useAiChat'
