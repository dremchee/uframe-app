import type { BlockRegistry, GlobalSettings, PageBlock, PageDocument, StyleViewport, SymbolDefinition, UframePlugin } from '@/core'
import { computed, shallowRef, watch } from 'vue'
import {
  cloneJsonValue,
  COMPONENT_SLOT_BLOCK_TYPE,
  createPageDocument,
  findBlock,
  getSymbolSlots,
  mergeGlobalsIntoDocument,
  serializeGlobalSettings,
  serializePageDocument,
} from '@/core'
import { useEditorBlockActions } from '@/vue/composables/editor/useEditorBlockActions'
import { useEditorBlockData } from '@/vue/composables/editor/useEditorBlockData'
import { useEditorBlockProps } from '@/vue/composables/editor/useEditorBlockProps'
import { useEditorBreakpoints } from '@/vue/composables/editor/useEditorBreakpoints'
import { useEditorClasses } from '@/vue/composables/editor/useEditorClasses'
import { useEditorDocumentActions } from '@/vue/composables/editor/useEditorDocumentActions'
import { useEditorDocumentLifecycle } from '@/vue/composables/editor/useEditorDocumentLifecycle'
import { useEditorDocumentMutations } from '@/vue/composables/editor/useEditorDocumentMutations'
import { useEditorFonts } from '@/vue/composables/editor/useEditorFonts'
import { cloneDocument } from '@/vue/composables/editor/useEditorHistory'
import { useEditorHistoryState } from '@/vue/composables/editor/useEditorHistoryState'
import { useEditorPages } from '@/vue/composables/editor/useEditorPages'
import { useEditorPlugins } from '@/vue/composables/editor/useEditorPlugins'
import { useEditorRequests } from '@/vue/composables/editor/useEditorRequests'
import { useEditorSelection } from '@/vue/composables/editor/useEditorSelection'
import { useEditorSharedContext } from '@/vue/composables/editor/useEditorSharedContext'
import { createEditorStorage } from '@/vue/composables/editor/useEditorStorage'
import { useEditorSymbolInstances } from '@/vue/composables/editor/useEditorSymbolInstances'
import { useEditorSymbolMaster } from '@/vue/composables/editor/useEditorSymbolMaster'
import { useEditorSymbolProperties } from '@/vue/composables/editor/useEditorSymbolProperties'
import { useEditorSymbolSlots } from '@/vue/composables/editor/useEditorSymbolSlots'
import { useEditorSymbolVariants } from '@/vue/composables/editor/useEditorSymbolVariants'
import { useEditorVariables } from '@/vue/composables/editor/useEditorVariables'
import { useEditorViewport } from '@/vue/composables/editor/useEditorViewport'
import { useUframeI18n } from '@/vue/i18n'

export interface UsePageEditorOptions {
  document?: PageDocument
  /**
   * Context-level settings shared across the page set (CSS variables,
   * breakpoints, …). Opt-in: when omitted the editor stays in single-document
   * mode and every global edit writes to the document, exactly as before. When
   * provided, globals read/write this shared object instead. See GlobalSettings.
   */
  globals?: GlobalSettings
  blocks?: BlockRegistry
  /**
   * Plugins to register at construction. Their blocks merge onto `blocks` and
   * their UI slots (toolbar / panels / overlays / canvas layers / settings
   * sections) become reactively available; runtime `registerPlugins` appends to
   * the same live set.
   */
  plugins?: UframePlugin[]
  readonly?: boolean
  /**
   * localStorage key under which the editor's UI preferences (sidebar pin,
   * active mode, panel width) are persisted. Defaults to a shared key —
   * pass a per-instance key to keep multiple editors on the same page
   * from overwriting each other.
   */
  storageKey?: string
}

export function usePageEditor(options: UsePageEditorOptions = {}) {
  const { t } = useUframeI18n()
  const document = shallowRef<PageDocument>(cloneDocument(options.document ?? createPageDocument()))
  // Shared context settings (variables / breakpoints / classes / symbols /
  // defaults). `null` → single-document mode: globals live on the document and
  // every read/write below falls back to it, so behaviour is unchanged. A host
  // opts into a shared context via `setGlobals`.
  const globals = shallowRef<GlobalSettings | null>(
    options.globals ? cloneJsonValue(options.globals) : null,
  )
  // The document to RENDER: the raw document merged with the shared globals. When
  // there's no globals it IS the document (same reference — cheap, stable). The
  // raw `document` stays the thing we persist / serialize; this is only fed to
  // the stylesheet / canvas / HTML export.
  const effectiveDocument = computed<PageDocument>(() =>
    globals.value ? mergeGlobalsIntoDocument(document.value, globals.value) : document.value,
  )

  // Monotonic "the rendered page may have changed" signal, bumped on ANY
  // assignment to the document or the shared globals — commits (all three
  // paths), undo/redo, load, symbol-edit splices. Reflow-sensitive consumers
  // (canvas hit-test, overlays, the style panel's reload) watch this ONE
  // source instead of each re-deriving which commit paths touch which store
  // (class styles, notably, can commit to the globals only).
  const documentRevision = shallowRef(0)
  watch([document, globals], () => {
    documentRevision.value++
  })

  const storage = createEditorStorage(options.storageKey)
  const editorPlugins = useEditorPlugins({ blocks: options.blocks, plugins: options.plugins })
  const { registry, registeredPlugins, blockDefinitions, registerPlugins, loadPlugins } = editorPlugins
  // Resolved preview URLs for picked media assets, keyed by `assetKey(ref)`.
  // Populated when the host returns an asset (the iframe has no storage access),
  // read by the canvas to show the chosen image. Runtime-only, never persisted.
  const assetPreviews = shallowRef<Record<string, string>>({})
  const editorSelection = useEditorSelection()
  const {
    selectedBlockId,
    selectionIntentNonce,
    selectedInstanceId,
    hoveredInstanceId,
    hoveredBlockId,
    hoverSource,
    syncedHoverId,
    selectBlock,
    selectBlockInstance,
    setHoveredBlock,
    setHoveredBlockInstance,
  } = editorSelection
  // The style layer currently being edited: 'base' or a breakpoint id. Kept
  // independent of the toolbar viewport so every breakpoint is reachable from
  // the breakpoint selector.
  const editBreakpoint = shallowRef<StyleViewport>('base')

  const editorHistory = useEditorHistoryState({ document, globals, readonly: options.readonly })
  const {
    beginTransient,
    endTransient,
    commit,
    commitGlobals,
    commitBoth,
    resetHistory,
    undo,
    redo,
    goToHistory,
    canUndo,
    canRedo,
    historyEntries,
    historyCursor,
  } = editorHistory

  const errors = shallowRef<string[]>([])
  const { normalizeInitialDocument, setGlobals, load } = useEditorDocumentLifecycle({
    document,
    globals,
    registry,
    errors,
    selectedBlockId,
    resetHistory,
  })
  normalizeInitialDocument()

  const editorBreakpoints = useEditorBreakpoints({ document, globals, editBreakpoint, commit, commitGlobals })
  const { breakpoints, addBreakpoint, updateBreakpoint, removeBreakpoint, resetBreakpoints } = editorBreakpoints
  const editorViewport = useEditorViewport({ breakpoints, editBreakpoint })
  const {
    isPreviewMode,
    viewport,
    customWidth,
    canvasWidth,
    spacingOverlay,
    setViewport,
    setEditBreakpoint,
    setSpacingOverlay,
  } = editorViewport

  const selectedBlock = computed(() => {
    if (!selectedBlockId.value)
      return undefined

    return findBlock(document.value.blocks, selectedBlockId.value)
  })

  const symbols = computed<SymbolDefinition[]>(() =>
    Object.values(effectiveDocument.value.symbols ?? {}).sort((a, b) => a.name.localeCompare(b.name)),
  )

  const { activeStyles, activeSymbols, commitSymbols, setGlobalDefaults } = useEditorSharedContext({
    document,
    globals,
    commit,
    commitGlobals,
  })

  const editorFonts = useEditorFonts({ document, globals, commit, commitGlobals })
  const { fontConfig, fonts, addFont, updateFont, removeFont } = editorFonts

  const editorRequests = useEditorRequests()
  const {
    editClassRequest,
    requestEditClass,
    revealBlockRequest,
    requestRevealBlock,
    revealInTreeRequest,
    requestRevealInTree,
  } = editorRequests

  const editorSymbolMaster = useEditorSymbolMaster({
    document,
    globals,
    activeSymbols,
    commitSymbols,
    resetHistory,
    selectedBlockId,
    selectBlock,
    requestRevealInTree,
  })
  const {
    editingSymbolId,
    editScopeRootId,
    enterSymbolEdit,
    enterInstanceMasterEdit,
    editInstanceSlotElement,
    exitSymbolEdit,
    updateSymbol,
    updateSnapshot,
  } = editorSymbolMaster

  const editorDocumentActions = useEditorDocumentActions({
    document,
    globals,
    selectedBlockId,
    activeSymbols,
    commit,
    commitBoth,
    updateSnapshot,
  })
  const { deleteSymbol, removeBlock } = editorDocumentActions

  const editorPages = useEditorPages({
    document,
    beforePageChange: () => {
      if (editingSymbolId.value)
        exitSymbolEdit()
    },
    load,
    commit,
  })
  const {
    pages,
    activePageId,
    isMultiPage,
    pagesView,
    pageGroups,
    setPages,
    selectPage,
    addPage,
    removePage,
    renamePage,
    setPageGroup,
    renameGroup,
    moveGroup,
    movePage,
  } = editorPages

  const editorVariables = useEditorVariables({ document, globals, commit, commitGlobals })
  const {
    variables,
    addVariable,
    updateVariable,
    renameVariable,
    removeVariable,
    reorderVariables,
  } = editorVariables

  const { updateBlock, applyAiBlocks } = useEditorDocumentMutations({
    document,
    registry,
    readonly: options.readonly,
    commit,
    selectedBlockId,
  })

  function validateSlotPropsUpdate(block: PageBlock, nextProps: Record<string, unknown>): boolean {
    if (block.type === COMPONENT_SLOT_BLOCK_TYPE) {
      const symbolId = editingSymbolId.value
      const name = nextProps.name
      const symbol = symbolId ? activeSymbols()[symbolId] : undefined
      const liveRoot = editScopeRootId.value
        ? findBlock(document.value.blocks, editScopeRootId.value)
        : document.value.blocks[0]
      if (typeof name === 'string' && symbol && liveRoot) {
        const duplicate = getSymbolSlots({ ...symbol, root: liveRoot })
          .some(slot => slot.id !== block.id && slot.props.name === name)
        if (duplicate) {
          errors.value = [t('properties.duplicateSlotName', { name })]
          return false
        }
      }
    }
    return true
  }

  const editorBlockProps = useEditorBlockProps({
    document,
    registry,
    errors,
    updateBlock,
    commit,
    validateSlotPropsUpdate,
  })
  const {
    updateBlockProps,
    replaceBlockProps,
    updateBlockStyle,
    setBlockHtmlId,
    setBlockName,
    updatePageStyle,
  } = editorBlockProps
  const editorBlockData = useEditorBlockData({ document, assetPreviews, updateBlock, updateBlockProps })
  const { setBlockBinding, setBlockSource, setBlockAsset, applyAsset } = editorBlockData

  const editorClasses = useEditorClasses({
    document,
    globals,
    effectiveDocument,
    updateBlock,
    commit,
    commitGlobals,
    commitBoth,
  })
  const {
    ensureClassExists,
    applyClassToBlock,
    removeClassFromBlock,
    extractBlockStyleToClass,
    createClassFromBlock,
    updateClassStyle,
    createCombo,
    renameClass,
    deleteClass,
  } = editorClasses

  // Master-edit lifecycle is owned by useEditorSymbolMaster.

  const editorSymbolProperties = useEditorSymbolProperties({
    document,
    editingSymbolId,
    activeSymbols,
    updateSymbol,
    commit,
  })
  const {
    addSymbolProperty,
    removeSymbolProperty,
    renameSymbolProperty,
    setInstanceProperty,
    resetInstanceProperty,
  } = editorSymbolProperties

  const editorSymbolSlots = useEditorSymbolSlots({
    document,
    registry,
    editingSymbolId,
    editScopeRootId,
    selectedBlockId,
    activeSymbols,
    commit,
  })
  const {
    addComponentSlot,
    insertBlockIntoInstanceSlot,
    insertSymbolIntoInstanceSlot,
    moveBlockIntoInstanceSlot,
    resetInstanceSlot,
    resolveInstanceSlot,
  } = editorSymbolSlots

  const editorBlockActions = useEditorBlockActions({
    document,
    registry,
    selectedBlockId,
    editingSymbolId,
    editScopeRootId,
    resolveInstanceSlot,
    commit,
  })
  const {
    addBlock,
    insertBlock,
    duplicateBlock,
    wrapBlock,
    unwrapBlock,
    setBlockHidden,
    resolveDefaultInsertion,
    spliceBlockInto,
    moveSelectedBlock,
    moveBlockToPosition,
  } = editorBlockActions

  const editorSymbolInstances = useEditorSymbolInstances({
    document,
    globals,
    selectedBlockId,
    activeSymbols,
    commit,
    commitBoth,
    resolveDefaultInsertion,
    spliceBlockInto,
  })
  const {
    saveBlockAsSymbol,
    insertSymbolInstance,
    addSymbolInstance,
    detachSymbolInstance,
  } = editorSymbolInstances

  const editorSymbolVariants = useEditorSymbolVariants({
    document,
    globals,
    activeSymbols,
    activeStyles,
    updateSymbol,
    commit,
    commitGlobals,
    commitBoth,
  })
  const {
    createVariant: createSymbolVariant,
    renameVariant: renameSymbolVariant,
    deleteVariant: deleteSymbolVariant,
    setVariantClasses: setSymbolVariantClasses,
    setInstanceVariant,
  } = editorSymbolVariants

  function renameSymbol(symbolId: string, nextName: string): boolean {
    const current = activeSymbols()[symbolId]
    if (!current)
      return false
    const trimmed = nextName.trim()
    if (!trimmed || trimmed === current.name)
      return false
    const symbolsNext = {
      ...activeSymbols(),
      [symbolId]: { ...current, name: trimmed, updatedAt: new Date().toISOString() },
    }
    commitSymbols(symbolsNext)
    return true
  }

  function serialize() {
    return serializePageDocument(document.value)
  }

  // The shared globals settings as JSON for the host to persist (null when there's
  // no shared context). The document is serialized separately via `serialize`.
  function serializeGlobals(): string | null {
    return globals.value ? serializeGlobalSettings(globals.value) : null
  }

  return {
    document,
    globals,
    effectiveDocument,
    documentRevision,
    setGlobals,
    setGlobalDefaults,
    pages,
    activePageId,
    pagesView,
    isMultiPage,
    setPages,
    selectPage,
    addPage,
    removePage,
    renamePage,
    pageGroups,
    setPageGroup,
    renameGroup,
    moveGroup,
    movePage,
    registry,
    registeredPlugins,
    registerPlugins,
    loadPlugins,
    blockDefinitions,
    symbols,
    selectedBlockId,
    selectionIntentNonce,
    selectedInstanceId,
    hoveredInstanceId,
    selectBlockInstance,
    setHoveredBlockInstance,
    editClassRequest,
    requestEditClass,
    revealBlockRequest,
    requestRevealBlock,
    revealInTreeRequest,
    requestRevealInTree,
    hoveredBlockId,
    hoverSource,
    syncedHoverId,
    setHoveredBlock,
    selectedBlock,
    isPreviewMode,
    viewport,
    setViewport,
    customWidth,
    canvasWidth,
    breakpoints,
    addBreakpoint,
    updateBreakpoint,
    removeBreakpoint,
    resetBreakpoints,
    editBreakpoint,
    setEditBreakpoint,
    spacingOverlay,
    setSpacingOverlay,
    beginTransient,
    endTransient,
    storage,
    errors,
    canUndo,
    canRedo,
    historyEntries,
    historyCursor,
    goToHistory,
    selectBlock,
    addBlock,
    updateBlock,
    applyAiBlocks,
    updateBlockProps,
    replaceBlockProps,
    setBlockBinding,
    setBlockSource,
    setBlockAsset,
    applyAsset,
    assetPreviews,
    updateBlockStyle,
    setBlockHtmlId,
    setBlockName,
    updatePageStyle,
    variables,
    addVariable,
    updateVariable,
    renameVariable,
    removeVariable,
    reorderVariables,
    fontConfig,
    fonts,
    addFont,
    updateFont,
    removeFont,
    removeBlock,
    duplicateBlock,
    wrapBlock,
    unwrapBlock,
    setBlockHidden,
    moveBlockTo: moveBlockToPosition,
    insertBlock,
    ensureClass: ensureClassExists,
    applyClass: applyClassToBlock,
    removeClass: removeClassFromBlock,
    createClass: createClassFromBlock,
    extractBlockStyleToClass,
    createCombo,
    updateClassStyle,
    renameClass,
    deleteClass,
    moveSelectedBlock,
    saveBlockAsSymbol,
    insertSymbolInstance,
    addSymbolInstance,
    detachSymbolInstance,
    renameSymbol,
    deleteSymbol,
    editingSymbolId,
    editScopeRootId,
    enterSymbolEdit,
    enterInstanceMasterEdit,
    editInstanceSlotElement,
    exitSymbolEdit,
    createSymbolVariant,
    renameSymbolVariant,
    deleteSymbolVariant,
    setSymbolVariantClasses,
    setInstanceVariant,
    addSymbolProperty,
    removeSymbolProperty,
    renameSymbolProperty,
    setInstanceProperty,
    resetInstanceProperty,
    addComponentSlot,
    insertBlockIntoInstanceSlot,
    insertSymbolIntoInstanceSlot,
    moveBlockIntoInstanceSlot,
    resetInstanceSlot,
    load,
    undo,
    redo,
    serialize,
    serializeGlobals,
  }
}
