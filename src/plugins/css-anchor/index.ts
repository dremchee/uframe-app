import type { Component } from 'vue'
import { definePlugin } from '@/core'
import CssAnchorStyleSection from './CssAnchorStyleSection.vue'
import { cssAnchorMessages } from './messages'

/** Optional authoring UI for the CSS Anchor Positioning Level 1 properties. */
export const cssAnchorPlugin = definePlugin<Component>({
  name: 'css-anchor',
  messages: cssAnchorMessages,
  styleSections: [CssAnchorStyleSection],
})

export default cssAnchorPlugin
export * from './anchor-css'
