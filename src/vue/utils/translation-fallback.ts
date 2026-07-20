import type { I18n } from '@/vue/i18n'

export interface LocalizedLabel {
  label?: string
  labelKey?: string
}

export interface LocalizedPlaceholder {
  placeholder?: string
  placeholderKey?: string
}

/** Resolves a translation key without ever exposing an unknown key in the UI. */
export function translatedOrFallback(
  key: string | undefined,
  fallback: string | undefined,
  t: I18n['t'],
): string | undefined {
  if (!key)
    return fallback
  const value = t(key)
  return value === key ? fallback : value
}

export function localizedLabel(value: LocalizedLabel, t: I18n['t']): string | undefined {
  return translatedOrFallback(value.labelKey, value.label, t)
}

export function localizedPlaceholder(value: LocalizedPlaceholder, t: I18n['t']): string | undefined {
  return translatedOrFallback(value.placeholderKey, value.placeholder, t)
}
