import type { InjectionKey } from 'vue'
import { computed, getCurrentInstance, inject, provide } from 'vue'
import { deepMergeRecord } from '@/core'
import { en } from './en'

export interface MessageTree { [key: string]: string | MessageTree }
/** A locale catalog: the same shape as `en`, every leaf overridable. */
// Keep the bundled catalog strongly typed while allowing plugin namespaces
// that are not known to the core editor.
export type LocaleMessages = DeepPartial<typeof en> & Record<string, unknown>
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

export interface I18n {
  /** Translate a dotted key, filling `{param}` placeholders. Unknown key → the key. */
  t: (key: string, params?: Record<string, string | number>) => string
}

/** Explicitly namespaced spelling for hosts that also use another i18n library. */
export type UframeI18n = I18n

const I18N_KEY: InjectionKey<I18n> = Symbol('uf-i18n')

function lookup(tree: MessageTree, key: string): string | undefined {
  let cur: string | MessageTree | undefined = tree
  for (const part of key.split('.')) {
    if (cur == null || typeof cur === 'string')
      return undefined
    cur = cur[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params)
    return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
}

function translator(active: MessageTree): I18n['t'] {
  return (key, params) => interpolate(lookup(active, key) ?? key, params)
}

/**
 * Provide the editor's i18n from reactive sources. English is the bundled base;
 * the host's messages for the active locale merge over it (so a host only
 * overrides the keys it cares about). Getters keep locale switching reactive.
 */
export function provideUframeI18n(
  getLocale: () => string | undefined,
  getMessages: () => Partial<Record<string, LocaleMessages>> | undefined,
  getPluginMessages?: () => Partial<Record<string, Record<string, unknown>>> | undefined,
): I18n {
  const active = computed<MessageTree>(() => {
    const locale = getLocale() || 'en'
    const override = getMessages()?.[locale] as MessageTree | undefined
    const pluginOverride = getPluginMessages?.()?.[locale] as MessageTree | undefined
    return deepMergeRecord(
      deepMergeRecord(en as unknown as Record<string, unknown>, pluginOverride as Record<string, unknown> | undefined),
      override as Record<string, unknown> | undefined,
    ) as MessageTree
  })
  const ctx: I18n = { t: (key, params) => translator(active.value)(key, params) }
  provide(I18N_KEY, ctx)
  return ctx
}

/** Bridge an already-created editor context into a standalone render tree. */
export function provideUframeI18nContext(ctx: I18n): I18n {
  provide(I18N_KEY, ctx)
  return ctx
}

// English-only fallback for components used without a provider (stories, tests).
const fallback: I18n = { t: translator(en as MessageTree) }

export function useUframeI18n(): I18n {
  // Composables are also used from standalone effect scopes (tests, plugin
  // setup and headless integrations), where Vue has no current component
  // instance and `inject()` returns undefined even with a fallback value.
  if (!getCurrentInstance())
    return fallback
  return inject(I18N_KEY, fallback) ?? fallback
}
