import type { BlockStyles } from '@/core/types/block-styles'
import type { GlobalSettings, PageDocument } from '@/core/types/page-document'
import { globalSettingsSchema } from '@/core/schemas/page-document.schema'

/**
 * A fresh, empty globals. `version` mirrors the document `version` convention;
 * `updatedAt` is left to the caller to stamp on save (kept empty here so the
 * factory stays pure/deterministic for tests).
 */
export function createGlobalSettings(overrides: Partial<GlobalSettings> = {}): GlobalSettings {
  return {
    variables: [],
    breakpoints: [],
    styles: {},
    symbols: {},
    defaults: {},
    version: 1,
    updatedAt: '',
    ...overrides,
  }
}

function mergeRecords<T>(
  base: Record<string, T> | undefined,
  over: Record<string, T> | undefined,
): Record<string, T> | undefined {
  if (!base && !over)
    return undefined
  // The document key wins on conflict, so it's spread last.
  return { ...(base ?? {}), ...(over ?? {}) }
}

function mergeStyle(
  base: BlockStyles | undefined,
  over: BlockStyles | undefined,
): BlockStyles | undefined {
  if (!base && !over)
    return undefined
  // Shallow per-property override is enough for page defaults (font/colour);
  // globals defaults don't carry nested state/responsive layers.
  return { ...(base ?? {}), ...(over ?? {}) }
}

/**
 * Produce the effective document to RENDER from `(document, globals)`. The raw
 * document is never mutated and is what gets saved — this output is only fed to
 * the stylesheet / canvas / HTML-export path. With no globals it returns the
 * document untouched. See GlobalSettings for the precedence rules.
 */
export function mergeGlobalsIntoDocument(
  doc: PageDocument,
  globals: GlobalSettings | null | undefined,
): PageDocument {
  if (!globals)
    return doc

  return {
    ...doc,
    // Shared fields are owned by globals whenever a context exists. Local
    // document values are used only in single-document mode (no globals).
    variables: globals.variables,
    fonts: globals.fonts,
    styles: mergeRecords(globals.styles, doc.styles),
    symbols: mergeRecords(globals.symbols, doc.symbols),
    settings: {
      ...doc.settings,
      breakpoints: globals.breakpoints,
      // Document overrides the globals default; globals default fills an empty page.
      background: doc.settings.background || globals.defaults?.background || '',
      style: mergeStyle(globals.defaults?.style, doc.settings.style),
    },
  }
}

export function parseGlobalSettings(input: unknown): GlobalSettings {
  return globalSettingsSchema.parse(input) as GlobalSettings
}

export function safeParseGlobalSettings(input: unknown) {
  return globalSettingsSchema.safeParse(input)
}

export function serializeGlobalSettings(globals: GlobalSettings): string {
  return JSON.stringify(globals, null, 2)
}
