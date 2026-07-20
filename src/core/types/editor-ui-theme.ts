/** Semantic design tokens for the editor interface. */
export interface EditorUiThemeTokens {
  /** Main editor chrome background. */
  background: string
  /** Raised panels, toolbars, dialogs, and cards. */
  panel: string
  /** Secondary and subdued panel surfaces. */
  panelMuted: string
  /** Default separator and control border. */
  border: string
  /** Stronger border used for focus and emphasis. */
  borderStrong: string
  /** Primary interface text. */
  text: string
  /** Secondary interface text. */
  muted: string
  /** Brand and selection accent. */
  accent: string
  /** Accent used for hover and pressed states. */
  accentStrong: string
  /** Destructive actions and validation errors. */
  danger: string
  /** Shared control and panel corner radius. */
  radius: string
  /** Shared floating-panel shadow. */
  shadow: string
}

/** A semantic editor theme with independent light and dark palettes. */
export interface EditorUiTheme {
  light?: EditorStyleTokens
  dark?: EditorStyleTokens
}

/** Public, prefix-free editor style overrides. */
export type EditorStyleTokens = Partial<EditorUiThemeTokens>

/** Defines an editor theme while preserving literal types and autocomplete. */
export function defineEditorTheme<const T extends EditorUiTheme>(theme: T): T {
  return theme
}

const TOKEN_PROPERTIES = {
  // Editor chrome and interactive control surfaces are intentionally distinct:
  // mapping `background` to shadcn's `--background` makes active tabs disappear
  // whenever the chrome and muted track share a colour. Raised `panel` is the
  // correct source for active controls, dialogs, cards, and popovers.
  background: ['--uf-bg'],
  panel: ['--uf-panel', '--background', '--card', '--popover', '--primary-foreground'],
  panelMuted: ['--uf-panel-muted', '--secondary', '--muted', '--accent'],
  border: ['--uf-border', '--border', '--input'],
  borderStrong: ['--uf-border-strong'],
  text: ['--uf-text', '--foreground', '--card-foreground', '--popover-foreground', '--secondary-foreground', '--accent-foreground'],
  muted: ['--uf-muted', '--muted-foreground'],
  accent: ['--uf-accent', '--primary', '--ring'],
  accentStrong: ['--uf-accent-strong'],
  danger: ['--uf-danger', '--destructive'],
  radius: ['--uf-radius', '--radius'],
  shadow: ['--uf-shadow'],
} as const satisfies Record<keyof EditorUiThemeTokens, readonly `--${string}`[]>

/** Converts a semantic palette into the CSS custom properties used internally. */
export function resolveEditorThemeTokens(
  theme: EditorUiTheme | undefined,
  mode: 'light' | 'dark',
): Record<string, string> {
  return resolveEditorStyleTokens(theme?.[mode])
}

/** Converts public prefix-free style tokens to internal CSS properties. */
export function resolveEditorStyleTokens(tokens: EditorStyleTokens | undefined): Record<string, string> {
  if (!tokens)
    return {}

  return Object.fromEntries(
    Object.entries(TOKEN_PROPERTIES)
      .flatMap(([token, properties]) => {
        const value = tokens[token as keyof EditorUiThemeTokens]
        return value == null || value === ''
          ? []
          : properties.map(property => [property, value])
      }),
  )
}
