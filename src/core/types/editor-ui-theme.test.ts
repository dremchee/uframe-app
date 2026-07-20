import { describe, expect, it } from 'vitest'
import { defineEditorTheme, resolveEditorStyleTokens, resolveEditorThemeTokens } from './editor-ui-theme'

describe('editor UI theme', () => {
  const theme = defineEditorTheme({
    light: {
      background: '#fff',
      accent: '#2563eb',
      radius: '10px',
    },
    dark: {
      background: '#111827',
      accent: '#60a5fa',
    },
  })

  it('maps the selected semantic palette to internal properties', () => {
    expect(resolveEditorThemeTokens(theme, 'dark')).toMatchObject({
      '--uf-bg': '#111827',
      '--uf-accent': '#60a5fa',
      '--primary': '#60a5fa',
      '--ring': '#60a5fa',
    })
    expect(resolveEditorThemeTokens(theme, 'dark')).not.toHaveProperty('--background')
  })

  it('keeps partial themes partial so editor defaults can fill the rest', () => {
    expect(resolveEditorThemeTokens(theme, 'light')).toMatchObject({
      '--uf-bg': '#fff',
      '--uf-accent': '#2563eb',
      '--uf-radius': '10px',
      '--radius': '10px',
    })
    expect(resolveEditorThemeTokens(undefined, 'light')).toEqual({})
  })

  it('accepts prefix-free one-off style tokens', () => {
    expect(resolveEditorStyleTokens({ panel: '#fff', borderStrong: '#64748b' })).toMatchObject({
      '--uf-panel': '#fff',
      '--card': '#fff',
      '--popover': '#fff',
      '--uf-border-strong': '#64748b',
    })
  })

  it('keeps chrome, active controls, and muted tracks on distinct surfaces', () => {
    expect(resolveEditorStyleTokens({
      background: '#f8fafc',
      panel: '#ffffff',
      panelMuted: '#f1f5f9',
    })).toMatchObject({
      '--uf-bg': '#f8fafc',
      '--background': '#ffffff',
      '--muted': '#f1f5f9',
      '--accent': '#f1f5f9',
    })
  })
})
