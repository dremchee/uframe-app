import type { FontProviderId } from '@/core'
import { ref } from 'vue'

// Default to local (installed) fonts where the browser can enumerate them,
// else the first web provider.
const localSupported = typeof window !== 'undefined' && 'queryLocalFonts' in window

/**
 * Module-scoped so the last provider chosen in the Add-font popover survives
 * both repeated opens and the Settings panel remounting when the sidebar
 * switches tabs — for the whole session.
 */
export const lastFontProvider = ref<FontProviderId>(localSupported ? 'local' : 'google')
