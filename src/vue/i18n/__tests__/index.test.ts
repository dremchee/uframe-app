// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { en } from '../en'
import { provideUframeI18n } from '../index'
import { ru } from '../ru'

function missingLeaves(source: Record<string, unknown>, translation: Record<string, unknown>, path = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const nextPath = path ? `${path}.${key}` : key
    if (value && typeof value === 'object')
      return missingLeaves(value as Record<string, unknown>, translation[key] as Record<string, unknown>, nextPath)
    return translation[key] === undefined ? [nextPath] : []
  })
}

describe('editor i18n', () => {
  it('keeps the Russian catalog complete, without English fallback strings', () => {
    expect(missingLeaves(en, ru)).toEqual([])
  })

  it('deep-merges plugin messages and lets the host override them', () => {
    const seen: string[] = []
    const Probe = defineComponent({
      setup() {
        const i18n = provideUframeI18n(
          () => 'ru',
          () => ({ ru: { common: { add: 'Добавить' }, plugin: { shared: 'host', hostOnly: 'Хост' } } }),
          () => ({ ru: { plugin: { pluginOnly: 'Плагин', shared: 'plugin' } } }),
        )
        seen.push(i18n.t('common.add'))
        seen.push(i18n.t('plugin.pluginOnly'))
        seen.push(i18n.t('plugin.shared'))
        seen.push(i18n.t('plugin.hostOnly'))
        seen.push(i18n.t('plugin.missing'))
        return () => h('div')
      },
    })
    const app = createApp(Probe)
    const el = document.createElement('div')
    document.body.append(el)
    app.mount(el)

    expect(seen).toEqual(['Добавить', 'Плагин', 'host', 'Хост', 'plugin.missing'])
    app.unmount()
    el.remove()
  })

  it('treats null and arrays as leaf overrides', () => {
    const seen: string[] = []
    const Probe = defineComponent({
      setup() {
        const i18n = provideUframeI18n(
          () => 'en',
          () => undefined,
          () => ({ en: { plugin: { nested: null, list: ['translated'] } } }),
        )
        seen.push(i18n.t('plugin.nested'))
        seen.push(i18n.t('plugin.list'))
        return () => h('div')
      },
    })
    const app = createApp(Probe)
    const el = document.createElement('div')
    document.body.append(el)
    app.mount(el)

    expect(seen).toEqual(['plugin.nested', 'plugin.list'])
    app.unmount()
    el.remove()
  })
})
