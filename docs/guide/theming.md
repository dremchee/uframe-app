# Theming

## Light / dark

Set the theme when mounting, or switch it at runtime — the editor has full
light/dark token sets built in:

```ts
const editor = createUframeEditor({ target, src, theme: 'dark' })

editor.setTheme('light')
```

The end user can also toggle the theme from the editor's own toolbar.

## Semantic theme / rebranding

Use `defineEditorTheme` to describe both palettes with prefix-free semantic
tokens. The editor translates them to its internal CSS properties, including
for dialogs and selects rendered through portals:

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

For a one-off override, use the same prefix-free keys through `styleTokens`:

```ts
editor.setStyleTokens({ accent: '#7c3aed', radius: '6px' })
```

Plugins may also contribute `styleTokens`; a plugin wins when it defines the
same key. Internal `--uf-*` properties are deliberately not part of the public
API, so the editor can evolve its CSS without changing host themes.
