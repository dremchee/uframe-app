# Localization

The editor includes English by default. Other UI catalogs are imported
individually so hosts do not download languages they do not use.

## Iframe embed

Import the catalog and pass it in `messages` together with the matching locale:

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'
import { ru } from '@dremchee/uframe/i18n/ru'

createUframeEditor({
  target,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  locale: 'ru',
  messages: { ru },
})
```

The same values can be changed after mounting:

```ts
editor.setLocale('ru')
editor.setMessages({ ru })
```

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
messages: {
  ru: {
    ...ru,
    'toolbar.save': 'Опубликовать',
  },
}
```
