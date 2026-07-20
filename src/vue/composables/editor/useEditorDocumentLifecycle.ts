import type { ShallowRef } from 'vue'
import type { BlockRegistry, GlobalSettings, PageDocument } from '@/core'
import {
  cloneJsonValue,
  nameUnnamedStyles,
  safeParsePageDocument,
  validateComponentSlots,
  validateDocumentBlocks,
  validateSymbolProperties,
} from '@/core'

export interface UseEditorDocumentLifecycleOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  registry: ShallowRef<BlockRegistry>
  errors: ShallowRef<string[]>
  selectedBlockId: ShallowRef<string | null>
  resetHistory: () => void
}

/**
 * Owns document handovers at editor boundaries: initial hydration, globals
 * replacement, parsing, validation, style normalization, and history resets.
 */
export function useEditorDocumentLifecycle(options: UseEditorDocumentLifecycleOptions) {
  const {
    document,
    globals,
    registry,
    errors,
    selectedBlockId,
    resetHistory,
  } = options

  // Block-local styles arriving from imports, AI, or host hydration are lifted
  // into named classes before they reach the editor. In shared-global mode the
  // globals claim class names before the page document.
  function normalizeLoadedStyles(nextDocument: PageDocument): PageDocument {
    if (globals.value) {
      const globalResult = nameUnnamedStyles(
        [],
        globals.value.symbols,
        globals.value.styles ?? {},
        nextDocument.styles,
      )
      if (globalResult.changed) {
        globals.value = {
          ...globals.value,
          symbols: globalResult.symbols,
          styles: globalResult.styles,
        }
      }

      const documentResult = nameUnnamedStyles(
        nextDocument.blocks,
        nextDocument.symbols,
        globals.value.styles ?? {},
        nextDocument.styles,
      )
      if (!documentResult.changed)
        return nextDocument

      globals.value = { ...globals.value, styles: documentResult.styles }
      return {
        ...nextDocument,
        blocks: documentResult.blocks,
        symbols: documentResult.symbols,
      }
    }

    const result = nameUnnamedStyles(
      nextDocument.blocks,
      nextDocument.symbols,
      nextDocument.styles ?? {},
    )
    return result.changed
      ? { ...nextDocument, blocks: result.blocks, symbols: result.symbols, styles: result.styles }
      : nextDocument
  }

  function normalizeInitialDocument() {
    document.value = normalizeLoadedStyles(document.value)
    resetHistory()
  }

  function setGlobals(nextGlobals: GlobalSettings | null) {
    globals.value = nextGlobals ? cloneJsonValue(nextGlobals) : null
    document.value = normalizeLoadedStyles(document.value)
    resetHistory()
  }

  function load(input: PageDocument | unknown): boolean {
    const parsed = safeParsePageDocument(input)
    if (!parsed.success) {
      errors.value = parsed.error.issues.map(issue =>
        `${issue.path.join('.') || 'document'}: ${issue.message}`,
      )
      return false
    }

    const loaded = normalizeLoadedStyles(cloneJsonValue(parsed.data as PageDocument))
    const validationDocument = globals.value
      ? { ...loaded, symbols: globals.value.symbols }
      : loaded
    const semanticErrors = [
      ...validateDocumentBlocks(validationDocument, registry.value).errors,
      ...validateSymbolProperties(validationDocument, registry.value).errors,
      ...validateComponentSlots(validationDocument).errors,
    ]
    if (semanticErrors.length) {
      errors.value = semanticErrors
      return false
    }

    errors.value = []
    document.value = loaded
    // Loading always returns to the page-level selection rather than a stale
    // block id from the document that was displayed before the handover.
    selectedBlockId.value = null
    resetHistory()
    return true
  }

  return { normalizeInitialDocument, setGlobals, load }
}
