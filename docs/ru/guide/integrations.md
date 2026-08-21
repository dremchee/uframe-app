# Интеграции

uframe поставляет эталонные интеграции в
[`integrations/`](https://github.com/dremchee/uframe-app/tree/main/integrations):
они встраивают редактор в CMS и рендерят результат во фронтенде. Контракт
минимален: JSON `PageDocument`, пакет `@dremchee/uframe/embed` на стороне
редактирования и `@dremchee/uframe/core` на стороне рендеринга.

Интеграции делятся на две роли:

- **Создание и хранение** — встроить редактор в CMS и сохранять `PageDocument`.
- **Рендеринг и публикация** — прочитать сохранённый документ и отобразить его во фронтенде.

| Интеграция | Роль | Стек | Статус |
| --- | --- | --- | --- |
| [Расширение Directus](https://github.com/dremchee/uframe-app/tree/main/integrations/directus) | Создание и хранение | Directus 11 | Доступно |
| [Nuxt-фронтенд](https://github.com/dremchee/uframe-app/tree/main/integrations/nuxt) | Рендеринг и публикация | Nuxt 3 | Доступно |
| [Плагин Strapi](https://github.com/dremchee/uframe-app/tree/main/integrations/strapi) | Создание и хранение | Strapi (React) | Планируется |

## Расширение Directus

`directus-extension-uframe` — набор Directus с тремя точками входа:

- **module** — менеджер страниц в левой панели без дополнительной настройки.
  При первом запуске создаёт скрытые коллекции `uframe_pages` (страницы с JSON
  полем `document`) и `uframe_globals` (одиночная запись с переменными,
  брейкпоинтами, классами и символами всего сайта).
- **interface** — пользовательский интерфейс для любого JSON-поля, если
  страницы должны быть обычной видимой коллекцией. Команда Save записывает
  документ обратно.
- **endpoint** — отдаёт собранное iframe-приложение по `/uframe/index.html`,
  поэтому iframe загружается с того же origin без внешнего хостинга.

Редактор работает изолированно в iframe через `@dremchee/uframe/embed`, а
Directus владеет списком страниц, разрешениями, ревизиями и черновиками.
Фронтенд читает исходные `PageDocument` из Items API. Подробности — в
[README расширения](https://github.com/dremchee/uframe-app/tree/main/integrations/directus).

## Nuxt-фронтенд

`uframe-frontend-nuxt` — SSR-приложение, которое рендерит сохранённые шаблоны.
Оно получает страницу из Directus, объединяет её с `uframe_globals`, наполняет
блоки `data-list` и `data-item` данными коллекций и рендерит через core pipeline.
Если CMS не настроена, используется встроенный пример.

Доступны оба способа из раздела [Рендеринг страниц](/guide/rendering): строковый
`renderHtml` и рекурсивный Vue-компонент с переопределениями типов. Подробности
— в [README фронтенда](https://github.com/dremchee/uframe-app/tree/main/integrations/nuxt).

## Плагин Strapi (планируется)

`strapi-plugin-uframe` будет плагином пользовательского поля Strapi. Admin
Strapi написан на React, поэтому поле — тонкая React-обёртка над тем же iframe
клиентом `@dremchee/uframe/embed`, который использует расширение Directus, и
хранит `PageDocument` как JSON-поле. Статус: ожидается начальная заготовка.

## Собственная интеграция

Поверхность интеграции небольшая:

- **Хост редактирования** (любой стек): смонтируйте `createUframeEditor` из
  `@dremchee/uframe/embed` и сохраните JSON `PageDocument`, который он выдаёт.
- **Фронтенд** (любой SSR/SSG/CSR-стек): передайте сохранённый документ в
  `resolveDocument` + `renderDocumentToHtml` / `renderDocumentToFragment` из
  `@dremchee/uframe/core`.

Обе стороны используют обычный JSON, поэтому интеграция в основном сводится к
выбору места хранения документа и способа загрузки данных для его привязок.
