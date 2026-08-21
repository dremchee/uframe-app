# API клиента и протокол

Embed-клиент создаёт iframe и предоставляет типизированный API для управления
редактором из приложения-хоста. Он не зависит от Vue и передаёт данные через
`postMessage`.

## Создание редактора

```ts
import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target,
  src: 'https://example.com/embed/index.html',
  document,
  locale: 'ru',
  messages: { ru },
  onChange: page => save(page),
  onSave: page => publish(page),
})
```

`target` — контейнер либо существующий iframe; `src` — URL собранного embed
приложения. Можно передать один `document` либо `pages` вместе с `globals` для
многостраничного сайта.

## Параметры

| Параметр | Назначение |
| --- | --- |
| `document` / `pages` / `activePageId` | Документ либо набор страниц и активная страница |
| `globals` | Общие переменные, брейкпоинты, классы и символы |
| `readonly`, `toolbarVisible`, `state` | Публичное состояние интерфейса |
| `theme`, `uiTheme`, `styleTokens` | Тема и семантические токены оформления |
| `locale`, `messages` | Язык интерфейса и каталоги переводов |
| `plugins` | URL модулей плагинов для загрузки при готовности |
| `schema`, `dataContext` | Схема и пример данных для привязок |

Колбэки `onChange`, `onSave`, `onPagesChange`, `onActivePageChange` и
`onGlobalsChange` синхронизируют содержимое с хостом. `onRequestAsset` получает
запрос медиаресурса; ответьте через `editor.setAsset(requestId, asset)` либо
`editor.setAsset(requestId, null)` при отмене.

## Управление смонтированным редактором

```ts
editor.setDocument(document)
editor.setPages(pages, activePageId)
editor.setActivePage(pageId)
editor.setGlobals(globals)
editor.setReadonly(true)
editor.setLocale('ru')
editor.setMessages({ ru })
editor.setTheme('dark')
editor.setUiTheme(uiTheme)
editor.setStyleTokens({ accent: '#7c3aed' })
editor.setSchema(schema)
editor.setDataContext({ data })
editor.requestSave()
```

Для переключения языка сначала вызовите `setMessages`, затем `setLocale`.
`setState` обновляет несколько полей публичного состояния одновременно;
`setViewport` и `setEditBreakpoint` меняют viewport холста. После завершения
работы вызовите `destroy()`.

## Ассеты, плагины и безопасность

Редактор не знает, где приложение хранит медиа. Обработайте `onRequestAsset`,
откройте собственный выбор файлов и передайте результат в `setAsset`. Плагины
можно перечислить при создании либо загрузить позже через `loadPlugins(urls)`.

Все сообщения протокола имеют namespace `uframe:` и версию. Клиент ограничивает
сообщения iframe ожидаемыми окном и origin, а embed-приложение получает origin
родителя из URL. Не отправляйте данные или ответы на сообщения произвольным
окнам и не используйте `*` как целевой origin.
