import type { GlobalSettings, PageDocument } from '@/core'
import { computed, shallowRef } from 'vue'
import { cloneJsonValue, replaceListItem } from '@/core'

// Defensive clone for trust-boundary handovers (initial hydration from an
// outside caller, load() after a zod parse). Inside the editor every mutation
// already returns a structurally-new document via the spread/immutable utils
// in core/utils, so history can store and return references without cloning.
export function cloneDocument(document: PageDocument): PageDocument {
  return cloneJsonValue(document)
}

// Context-level settings (variables / breakpoints / classes / symbols /
// defaults) are global across the page set, so they ride in the SAME history
// timeline as the document — one undo restores both. `globals` is null when no
// host has opted into a shared context (then the editor behaves exactly as
// before, with every entry carrying a null globals).
export interface HistoryEntry {
  /** Snapshot of the document at this step (stored by reference — see below). */
  document: PageDocument
  /** Snapshot of the shared globals settings at this step (null in single-doc mode). */
  globals: GlobalSettings | null
  /** Human label for the action that produced this state (shown in the log). */
  label: string
  /** Epoch ms when this entry was recorded (shown in the history log). */
  createdAt: number
}

// Cap the timeline so a long session can't grow it without bound. When full,
// the oldest entries are dropped (you can't undo past them).
const MAX_ENTRIES = 100

// Coalesce a rapid run of same-label edits (per-keystroke typing, scrubbing a
// field, etc.) into the current step instead of pushing one entry per change —
// otherwise the timeline floods with near-identical "Edit block" rows. A pause
// longer than this window, a different action label, or navigating the timeline
// all break the run so the next edit opens a fresh, undoable step.
const COALESCE_WINDOW_MS = 600

export function useEditorHistory(initialDocument: PageDocument, initialGlobals: GlobalSettings | null = null) {
  const initialLabel = 'history.initial'
  // A single timeline + a cursor (vs. past/future stacks) so the UI can show the
  // whole log and jump to any entry. entries[cursor] is the live state.
  // Snapshots are immutable references: commit() always builds a fresh top-level
  // object and the tree utils never mutate input, so we needn't deep-clone here.
  const entries = shallowRef<HistoryEntry[]>([{ document: initialDocument, globals: initialGlobals, label: initialLabel, createdAt: Date.now() }])
  const cursor = shallowRef(0)

  const canUndo = computed(() => cursor.value > 0)
  const canRedo = computed(() => cursor.value < entries.value.length - 1)

  // Tracks the last push so a continuing same-label burst within the window
  // coalesces. Cleared (via breakRun) whenever the run should stop coalescing.
  let lastPushAt = 0
  let lastPushLabel: string | null = null
  function breakRun() {
    lastPushLabel = null
  }

  // Record a new state after the cursor, dropping any redo branch ahead of it.
  // Trim the oldest entries past the cap so the timeline stays bounded.
  // `coalesce` opts in to burst-folding — set it for incremental edits (typing,
  // scrubbing a field) but NOT for discrete commands (add / delete / move),
  // which must each be their own undo step even when fired in quick succession.
  function push(document: PageDocument, globals: GlobalSettings | null, label: string, coalesce = false) {
    const now = Date.now()
    // A continuation of a rapid same-label run at the tip folds into the current
    // entry rather than adding a step. Only at the tip — after an undo/jump the
    // run is already broken, so this never rewrites a past entry or a redo branch.
    if (
      coalesce
      && lastPushLabel === label
      && now - lastPushAt < COALESCE_WINDOW_MS
      && cursor.value === entries.value.length - 1
    ) {
      lastPushAt = now
      entries.value = replaceListItem(entries.value, cursor.value, { document, globals, label, createdAt: now })
      return
    }
    lastPushAt = now
    lastPushLabel = label
    let next = [...entries.value.slice(0, cursor.value + 1), { document, globals, label, createdAt: now }]
    if (next.length > MAX_ENTRIES)
      next = next.slice(next.length - MAX_ENTRIES)
    entries.value = next
    cursor.value = next.length - 1
  }

  // Update the current entry's snapshot in place (transient gesture frames) —
  // the gesture collapses into the single step opened by its first push().
  function replaceCurrent(document: PageDocument, globals: GlobalSettings | null) {
    // A gesture owns its step; end it so the next edit can't fold into it.
    breakRun()
    const current = entries.value[cursor.value]!
    entries.value = replaceListItem(entries.value, cursor.value, { ...current, document, globals })
  }

  function undo(): HistoryEntry {
    breakRun()
    if (cursor.value > 0)
      cursor.value -= 1
    return entries.value[cursor.value]
  }

  function redo(): HistoryEntry {
    breakRun()
    if (cursor.value < entries.value.length - 1)
      cursor.value += 1
    return entries.value[cursor.value]
  }

  // Jump straight to an entry (clicking the history log).
  function goto(index: number): HistoryEntry {
    breakRun()
    cursor.value = Math.min(Math.max(index, 0), entries.value.length - 1)
    return entries.value[cursor.value]
  }

  function reset(document = initialDocument, globals: GlobalSettings | null = initialGlobals, label = initialLabel): HistoryEntry {
    breakRun()
    const entry = { document, globals, label, createdAt: Date.now() }
    entries.value = [entry]
    cursor.value = 0
    return entry
  }

  return {
    entries,
    cursor,
    canUndo,
    canRedo,
    push,
    replaceCurrent,
    undo,
    redo,
    goto,
    reset,
  }
}
