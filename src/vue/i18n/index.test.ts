// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { provideUframeI18n } from './index'

describe('editor i18n', () => {
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
