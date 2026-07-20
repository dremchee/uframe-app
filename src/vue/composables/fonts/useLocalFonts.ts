import { ref, shallowRef } from 'vue'
import { useUframeI18n } from '@/vue/i18n'

// The Local Font Access API isn't in the DOM lib types yet.
interface LocalFontData { family: string, fullName: string, postscriptName: string, style: string }
type QueryLocalFonts = () => Promise<LocalFontData[]>

/**
 * Enumerate the fonts installed on the designer's machine via the Local Font
 * Access API (Chromium-only, secure context, permission-gated). `load()` must
 * run from a user gesture — it triggers the one-time permission prompt.
 * Progressive enhancement: `supported` is false elsewhere and callers hide the UI.
 */
export function useLocalFonts() {
  const { t } = useUframeI18n()
  const supported = typeof window !== 'undefined' && 'queryLocalFonts' in window
  const families = shallowRef<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    if (!supported)
      return
    loading.value = true
    error.value = null
    try {
      const query = (window as unknown as { queryLocalFonts: QueryLocalFonts }).queryLocalFonts
      const fonts = await query()
      families.value = [...new Set(fonts.map(font => font.family))].sort((a, b) => a.localeCompare(b))
    }
    catch (err) {
      // Permission denied / dismissed lands here — surface it, don't throw.
      error.value = err instanceof Error ? err.message : t('fonts.readError')
    }
    finally {
      loading.value = false
    }
  }

  return { supported, families, loading, error, load }
}
