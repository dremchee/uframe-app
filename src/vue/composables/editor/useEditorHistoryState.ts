import type { ShallowRef } from 'vue'
import type { HistoryEntry } from './useEditorHistory'
import type { GlobalSettings, PageDocument } from '@/core'
import { useEditorHistory } from './useEditorHistory'

export interface UseEditorHistoryStateOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  readonly?: boolean
}

/** Owns history snapshots, commit routing and transient gesture coalescing. */
export function useEditorHistoryState(options: UseEditorHistoryStateOptions) {
  const { document, globals } = options
  const history = useEditorHistory(document.value, globals.value)
  let transient = false

  function beginTransient(label = 'history.edit') {
    if (transient || options.readonly)
      return
    history.push(document.value, globals.value, label)
    transient = true
  }

  function endTransient() {
    transient = false
  }

  function commit(nextDocument: PageDocument, label = 'history.edit', coalesce = false) {
    if (options.readonly)
      return

    const stamped = { ...nextDocument, updatedAt: new Date().toISOString() }
    document.value = stamped
    if (transient)
      history.replaceCurrent(stamped, globals.value)
    else
      history.push(stamped, globals.value, label, coalesce)
  }

  function commitGlobals(nextGlobals: GlobalSettings, label = 'history.edit', coalesce = false) {
    if (options.readonly)
      return

    const stamped = { ...nextGlobals, updatedAt: new Date().toISOString() }
    globals.value = stamped
    if (transient)
      history.replaceCurrent(document.value, stamped)
    else
      history.push(document.value, stamped, label, coalesce)
  }

  function commitBoth(nextDocument: PageDocument, nextGlobals: GlobalSettings, label = 'history.edit') {
    if (options.readonly)
      return

    const now = new Date().toISOString()
    const stampedDocument = { ...nextDocument, updatedAt: now }
    const stampedGlobals = { ...nextGlobals, updatedAt: now }
    document.value = stampedDocument
    globals.value = stampedGlobals
    if (transient)
      history.replaceCurrent(stampedDocument, stampedGlobals)
    else
      history.push(stampedDocument, stampedGlobals, label)
  }

  function resetHistory(nextDocument = document.value, nextGlobals = globals.value, label?: string) {
    return history.reset(nextDocument, nextGlobals, label)
  }

  function applyHistoryEntry(entry: Pick<HistoryEntry, 'document' | 'globals'>) {
    transient = false
    document.value = entry.document
    globals.value = entry.globals
  }

  function undo() {
    applyHistoryEntry(history.undo())
  }

  function redo() {
    applyHistoryEntry(history.redo())
  }

  function goToHistory(index: number) {
    applyHistoryEntry(history.goto(index))
  }

  return {
    history,
    beginTransient,
    endTransient,
    commit,
    commitGlobals,
    commitBoth,
    resetHistory,
    undo,
    redo,
    goToHistory,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    historyEntries: history.entries,
    historyCursor: history.cursor,
  }
}
