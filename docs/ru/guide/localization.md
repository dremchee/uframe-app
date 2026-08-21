# Локализация

Английский каталог встроен в редактор и используется как запасной. Остальные
каталоги импортируются отдельно, поэтому приложение-хост загружает только
нужные языки.

## Определение начального языка

Язык редактора выбирает приложение-хост. uframe не считывает настройки браузера
самостоятельно: так результат предсказуем, а сохранённый выбор пользователя
можно поставить выше браузерного значения по умолчанию.

Если язык уже известен приложению, передайте его редактору. В противном случае
сопоставьте упорядоченный список языков браузера с каталогами, которые вы
поставляете. Пример ниже принимает и региональный код, например `ru-RU` для
каталога `ru`, и возвращает английский при отсутствии совпадения:

```ts
const supportedLocales = ['ru'] as const
type SupportedLocale = typeof supportedLocales[number]

function detectEditorLocale(languages: readonly string[]): SupportedLocale | 'en' {
  for (const language of Intl.getCanonicalLocales(languages)) {
    if (supportedLocales.includes(language as SupportedLocale))
      return language as SupportedLocale

    if (language.split('-')[0] === 'ru')
      return 'ru'
  }

  return 'en'
}

// Вызывайте в браузере. При SSR передайте язык, разрешённый приложением.
const locale = detectEditorLocale(navigator.languages)
```

`navigator.languages` упорядочен по предпочтениям пользователя. Не заменяйте
им явный выбор, уже сохранённый в приложении.

## Iframe-встраивание

Импортируйте каталог и передайте его вместе с соответствующим языком в
`messages`:

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

## Переключение языка после монтирования

Храните выбранный язык в состоянии приложения-хоста и обновляйте редактор при
его изменении. Сначала передайте нужный каталог, затем язык: это исключает даже
кратковременное отображение английских запасных строк.

```ts
function setEditorLanguage(locale: 'en' | 'ru') {
  editor.setMessages(locale === 'ru' ? { ru } : {})
  editor.setLocale(locale)
}
```

`setMessages` заменяет переводы, переданные хостом. При каждом вызове передавайте
каталог активного языка.

## Vue-библиотека

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

## Доступные каталоги

| Язык | Импорт | Экспорт |
| --- | --- | --- |
| Английский (`en`) | Встроен | — |
| Русский (`ru`) | `@dremchee/uframe/i18n/ru` | `ru` |

Каталоги могут быть неполными: отсутствующие строки берутся из английского.
Собственные переводы можно объединять с каталогом; значения от приложения-хоста
имеют приоритет над встроенными переводами и переводами плагинов.

```ts
const messages = {
  ru: {
    ...ru,
    'toolbar.save': 'Опубликовать',
  },
}
```
