import { ref } from 'vue'
import { useUframeI18n } from '@/vue/i18n'

export interface PromptDialogOptions {
  title: string
  description?: string
  label?: string
  value?: string
  placeholder?: string
  confirmText?: string
  onConfirm: (value: string) => void
}

/**
 * Drives one shared <PromptDialog v-model:open="open"> instance — replaces
 * the legacy `window.prompt()` calls. Multiple call sites in a component
 * (rename, save-as-component, ...) share the same state ref; `openPrompt`
 * stashes the per-call options + the onConfirm callback, then the dialog
 * fires `confirm` → `handleConfirm` calls the stored callback.
 */
export function usePromptDialog() {
  const { t } = useUframeI18n()
  const open = ref(false)
  const title = ref('')
  const description = ref('')
  const label = ref(t('common.name'))
  const value = ref('')
  const placeholder = ref('')
  const confirmText = ref(t('common.save'))
  let onConfirm: ((value: string) => void) | null = null

  function openPrompt(options: PromptDialogOptions) {
    title.value = options.title
    description.value = options.description ?? ''
    label.value = options.label ?? t('common.name')
    value.value = options.value ?? ''
    placeholder.value = options.placeholder ?? ''
    confirmText.value = options.confirmText ?? t('common.save')
    onConfirm = options.onConfirm
    open.value = true
  }

  function handleConfirm(submitted: string) {
    onConfirm?.(submitted)
  }

  return {
    open,
    title,
    description,
    label,
    value,
    placeholder,
    confirmText,
    openPrompt,
    handleConfirm,
  }
}
