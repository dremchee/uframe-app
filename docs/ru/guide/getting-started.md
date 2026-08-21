# Начало работы

`@dremchee/uframe` — блочный редактор страниц с двумя способами интеграции:

- изолированное iframe-приложение для любого стека хоста;
- Vue-библиотека, если нужны пользовательские блоки, панели или прямой доступ к рантайму редактора.

## Встраивание размещённого редактора

Самый быстрый способ не требует собственной сборки или деплоя редактора.
Установите небольшой, независимый от фреймворка клиент для хоста:

```bash
pnpm add @dremchee/uframe
```

Затем смонтируйте размещённое приложение редактора:

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target: document.querySelector('#editor')!,
  src: 'https://uframe-app.netlify.app/embed/index.html',
  document: myDocument,
  onSave: document => fetch('/api/pages/home', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(document),
  }),
})
```

`createUframeEditor` создаёт iframe и общается с ним через типизированный
протокол `postMessage`. У клиента нет peer-зависимостей от фреймворка, поэтому
он работает с React, Vue, Svelte, приложениями с серверным рендерингом и
обычным HTML.

Полный [API клиента](/guide/embedding) описывает многостраничные документы,
ассеты, подключаемые во время работы плагины и состояние редактора.

## Самостоятельное размещение редактора

Если редактор должен отдаваться с вашего домена или быть привязан к конкретной
версии, соберите статическое iframe-приложение из репозитория:

```bash
pnpm install
pnpm build:embed
```

Результат находится в `build/embed/`. Опубликуйте эту папку на любом статическом
хостинге и укажите её `index.html` как `src`:

```ts
createUframeEditor({
  target,
  src: 'https://static.example.com/uframe/embed/index.html',
})
```

Храните `index.html`, его ассеты и необязательную папку `plugins/` вместе в
одном месте размещения.

## Использование Vue-библиотеки

Для нативной Vue-интеграции импортируйте `PageEditor` и стили, а не создавайте
iframe:

```vue
<script setup lang="ts">
import { PageEditor } from '@dremchee/uframe'
import '@dremchee/uframe/styles.css'

const page = defineModel('page', { required: true })
</script>

<template>
  <PageEditor v-model="page" @save="savePage" />
</template>
```

Vue-путь поддерживает пользовательские блоки и прямые плагины. Полный API
описан в разделе [Расширение редактора](/guide/extending).

## Следующие шаги

- [Редактирование на холсте](/guide/editing)
- [Настройка локализации](./localization)
- [Рендеринг и экспорт страниц](/guide/rendering)
- [Темизация редактора](/guide/theming)
