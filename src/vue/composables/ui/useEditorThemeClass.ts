import type { EditorStorageRef } from '@/vue/composables/editor/useEditorStorage'
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'

/** Keeps the editor chrome's root theme class aligned with its stored setting. */
export function useEditorThemeClass(storage: EditorStorageRef) {
  const prefersDark = ref(false)
  const onPreferenceChange = (event: MediaQueryListEvent) => {
    prefersDark.value = event.matches
  }

  const isDark = computed(() => {
    const theme = storage.value.theme
    return theme === 'dark' || (theme === 'system' && prefersDark.value)
  })
  if (typeof window !== 'undefined' && window.matchMedia) {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', onPreferenceChange)
    watchEffect(() => {
      root.classList.toggle('dark', isDark.value)
    })
    onBeforeUnmount(() => {
      mediaQuery.removeEventListener('change', onPreferenceChange)
      root.classList.remove('dark')
    })
  }

  return { isDark }
}
