# Темизация

## Светлая и тёмная темы

Задайте тему при монтировании или переключайте её во время работы: полный
набор токенов для светлой и тёмной палитры уже встроен в редактор.

```ts
const editor = createUframeEditor({ target, src, theme: 'dark' })

editor.setTheme('light')
```

Пользователь также может переключать тему в панели инструментов редактора.

## Семантическая тема и ребрендинг

Опишите обе палитры через `defineEditorTheme`, используя семантические токены
без префикса. Редактор преобразует их во внутренние CSS-свойства, в том числе
для диалогов и select-элементов, отрисованных через порталы:

```ts
import { defineEditorTheme } from '@dremchee/uframe/core'

const uiTheme = defineEditorTheme({
  light: {
    background: '#f8fafc',
    panel: '#ffffff',
    text: '#0f172a',
    accent: '#2563eb',
    radius: '8px',
  },
  dark: {
    background: '#0f172a',
    panel: '#1e293b',
    text: '#f8fafc',
    accent: '#60a5fa',
    radius: '8px',
  },
})

const editor = createUframeEditor({
  target,
  src,
  uiTheme,
})

editor.setUiTheme(uiTheme)
```

Для разового переопределения используйте те же ключи без префикса через
`styleTokens`:

```ts
editor.setStyleTokens({ accent: '#7c3aed', radius: '6px' })
```

Плагины также могут добавлять `styleTokens`; при совпадении ключа побеждает
значение плагина. Внутренние свойства `--uf-*` намеренно не входят в публичный
API, поэтому CSS редактора можно развивать, не меняя темы хостов.
