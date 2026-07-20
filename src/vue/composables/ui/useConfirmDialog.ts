import { ref } from 'vue'
import { useUframeI18n } from '@/vue/i18n'

export interface ConfirmDialogOptions {
  title: string
  description?: string
  confirmText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

/**
 * Drives one shared <ConfirmDialog v-model:open="open"> instance — replaces
 * the legacy `window.confirm()` calls. Mirrors usePromptDialog but without a
 * value input.
 */
export function useConfirmDialog() {
  const { t } = useUframeI18n()
  const open = ref(false)
  const title = ref('')
  const description = ref('')
  const confirmText = ref(t('common.confirm'))
  const variant = ref<'default' | 'destructive'>('default')
  let action: (() => void) | null = null

  function openConfirm(options: ConfirmDialogOptions) {
    title.value = options.title
    description.value = options.description ?? ''
    confirmText.value = options.confirmText ?? t('common.confirm')
    variant.value = options.variant ?? 'default'
    action = options.onConfirm
    open.value = true
  }

  function handleConfirm() {
    action?.()
  }

  return {
    open,
    title,
    description,
    confirmText,
    variant,
    openConfirm,
    handleConfirm,
  }
}
