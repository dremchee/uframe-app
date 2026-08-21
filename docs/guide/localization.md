# Localization

The editor includes English by default. Other UI catalogs are imported
individually so hosts do not download languages they do not use.

## Determine the initial language

The host application chooses the editor language. uframe does not read browser
preferences itself: this keeps the editor deterministic and lets an application
give its saved user preference priority over the browser default.

Pass your application's locale when it is available. Otherwise, match the
browser's ordered language preferences against the catalogs you ship. This
example also accepts a regional browser preference such as `ru-RU` for the
`ru` catalog and falls back to English:

```ts
const supportedLocales = ['de', 'es', 'fr', 'ja', 'pt-BR', 'ru', 'zh-CN'] as const
type SupportedLocale = typeof supportedLocales[number]

function detectEditorLocale(languages: readonly string[]): SupportedLocale | 'en' {
  const supported = new Set<string>(supportedLocales)

  for (const language of Intl.getCanonicalLocales(languages)) {
    if (supported.has(language))
      return language as SupportedLocale

    const baseLanguage = language.split('-')[0]
    const match = supportedLocales.find(locale => locale.split('-')[0] === baseLanguage)
    if (match)
      return match
  }

  return 'en'
}

// Call this in the browser. In SSR, pass the locale resolved by your app instead.
const locale = detectEditorLocale(navigator.languages)
```

`navigator.languages` is ordered by user preference. Do not use it to replace
an explicit choice the user has already made in your application.

## Iframe embed

Import the catalog and pass it in `messages` together with the matching locale:

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'
import { ru } from '@dremchee/uframe/i18n/ru'

const editor = createUframeEditor({
  target,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  locale: 'ru',
  messages: { ru },
})
```

## Switch languages after mounting

Keep the selected locale in host state and update the editor when it changes.
Load or provide the matching catalog before changing the locale, so the editor
does not briefly show English fallback strings. If you only support one
additional language, the catalog imported above is enough:

```ts
function setEditorLanguage(locale: 'en' | 'ru') {
  editor.setMessages(locale === 'ru' ? { ru } : {})
  editor.setLocale(locale)
}
```

For a language picker with several catalogs, import the catalogs you offer and
look them up by locale. Calling `setMessages` replaces the host-provided
catalogs, so include the catalog for the selected locale in every call.

## Vue library

```vue
<script setup lang="ts">
import { PageEditor } from '@dremchee/uframe'
import { ru } from '@dremchee/uframe/i18n/ru'

const page = defineModel('page', { required: true })
</script>

<template>
  <PageEditor v-model="page" locale="ru" :messages="{ ru }" />
</template>
```

## Available catalogs

| Locale | Import | Export |
| --- | --- | --- |
| German (`de`) | `@dremchee/uframe/i18n/de` | `de` |
| Spanish (`es`) | `@dremchee/uframe/i18n/es` | `es` |
| French (`fr`) | `@dremchee/uframe/i18n/fr` | `fr` |
| Japanese (`ja`) | `@dremchee/uframe/i18n/ja` | `ja` |
| Portuguese — Brazil (`pt-BR`) | `@dremchee/uframe/i18n/pt-br` | `ptBR` |
| Russian (`ru`) | `@dremchee/uframe/i18n/ru` | `ru` |
| Simplified Chinese (`zh-CN`) | `@dremchee/uframe/i18n/zh-cn` | `zhCN` |

Catalogs may be partial: missing messages fall back to English. You can merge
or override any catalog with your own messages; host-provided values take
precedence over built-in and plugin translations.

```ts
const messages = {
  ru: {
    ...ru,
    'toolbar.save': 'Опубликовать',
  },
}
```
