import type { Ref } from 'vue'
import type { BaseBlockStyles, BlockStyles, PageBlock, StyleBreakpoint } from '@/core'
import type { StateKey, ViewportKey } from '@/vue/components/style-panel/StyleVariantSelector.vue'
import type { EditingTarget } from '@/vue/composables/style/useBlockClasses'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { useThrottleFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { cloneJsonValue, inheritedBreakpointIds } from '@/core'

/**
 * The style editing model for the properties panel. Owns `activeStyle` (a
 * working copy of the styles for the current target — block / page / class),
 * keeps it in sync with selection, throttle-commits edits, and exposes
 * `blockSlice`: the flat style subset for the active breakpoint + state that the
 * StylePanel binds to (reading the effective value, writing only the override
 * delta). Extracted verbatim from PropertiesPanel.
 */
export function useBlockStyleModel(params: {
  editor: PageEditorInstance
  block: Ref<PageBlock | undefined>
  editingTarget: Ref<EditingTarget>
  viewport: Ref<ViewportKey>
  styleState: Ref<StateKey>
}) {
  const { editor, block, editingTarget, viewport, styleState } = params

  const activeStyle = ref<BlockStyles>({})
  let skipStyleEmit = false

  function snapshotStyle(): BlockStyles {
    if (editingTarget.value.kind === 'page') {
      return cloneJsonValue(editor.document.value.settings.style ?? {})
    }
    if (editingTarget.value.kind === 'class') {
      const name = editingTarget.value.name
      return cloneJsonValue(editor.effectiveDocument.value.styles?.[name] ?? {})
    }
    return cloneJsonValue(block.value?.style ?? {})
  }

  function reloadActiveStyle() {
    skipStyleEmit = true
    activeStyle.value = snapshotStyle()
  }

  watch(
    [
      editingTarget,
      () => block.value?.id,
      // The revision bumps on every document AND globals assignment — class
      // styles can live on the shared globals store, so a canvas gesture
      // editing such a class (e.g. a grid gap drag) commits to the globals
      // only; without it the panel's fields would keep the pre-drag snapshot.
      () => editor.documentRevision.value,
    ],
    reloadActiveStyle,
    { immediate: true },
  )

  // Throttled (not debounced) so drag-scrub on a SpacingField actually
  // re-applies styles every frame instead of waiting for the gesture to
  // idle — the canvas spacing overlay and selection rect can then follow
  // reactively. The throttle window matches a single rAF tick so visual
  // feedback stays smooth; coalescing into one history entry per drag is
  // a separate concern.
  const emitStyleUpdate = useThrottleFn(
    () => {
      const value = cloneJsonValue(activeStyle.value)
      if (editingTarget.value.kind === 'page') {
        editor.updatePageStyle(value)
      }
      else if (editingTarget.value.kind === 'class') {
        editor.updateClassStyle(editingTarget.value.name, value)
      }
      else if (block.value) {
        // "No unnamed selectors": a CLASS-LESS element (fresh from the
        // library, or after losing its last class) shows the full editor, and
        // its first style edit moves everything (leftover local styles
        // included — the snapshot already merged them) into a fresh
        // auto-named class, retargeting the panel to it. The classed branch
        // is defensive only — with Edit block gone the UI can't emit here for
        // a classed element. Clearing back to empty stays local.
        const hasClasses = (block.value.classes?.length ?? 0) > 0
        if (hasClasses || Object.keys(value).length === 0) {
          editor.updateBlockStyle(block.value.id, value)
        }
        else {
          const name = editor.extractBlockStyleToClass(block.value.id, value)
          if (name)
            editingTarget.value = { kind: 'class', name }
        }
      }
    },
    16,
    true,
    true,
  )

  watch(
    activeStyle,
    () => {
      if (skipStyleEmit) {
        skipStyleEmit = false
        return
      }
      emitStyleUpdate()
    },
    { deep: true },
  )
  // The initial (immediate) reloadActiveStyle above set skipStyleEmit=true, but
  // it ran before this watch existed, so nothing consumed the flag — without
  // this reset the user's *first* style edit would be swallowed.
  skipStyleEmit = false

  // The styles a breakpoint inherits before its own override. A breakpoint
  // inherits base plus every same-direction breakpoint that precedes it in the
  // cascade order — e.g. the mobile media query (≤768) also matches tablet
  // (≤1024), so mobile shows base + tablet; mobile-S shows base + tablet +
  // mobile; the min-width "wide" tier inherits base only.
  function inheritedStyles(
    value: BlockStyles,
    breakpoint: StyleBreakpoint,
  ): BaseBlockStyles {
    const { states: _states, responsive: _responsive, ...base } = value
    let merged: Record<string, unknown> = { ...base }
    for (const ancestorId of inheritedBreakpointIds(
      editor.breakpoints.value,
      breakpoint,
    ))
      merged = { ...merged, ...(value.responsive?.[ancestorId] ?? {}) }
    return merged as BaseBlockStyles
  }

  const blockSlice = computed<BaseBlockStyles>({
    get() {
      const value = activeStyle.value
      if (styleState.value !== 'default')
        return (value.states?.[styleState.value] ?? {}) as BaseBlockStyles
      if (viewport.value !== 'base') {
        // Prefill with the effective (inherited + override) value so fields show
        // what the breakpoint actually resolves to, not just the override delta.
        return {
          ...inheritedStyles(value, viewport.value),
          ...(value.responsive?.[viewport.value] ?? {}),
        } as BaseBlockStyles
      }

      const { states: _states, responsive: _responsive, ...flat } = value
      return flat as BaseBlockStyles
    },
    set(next) {
      const current = activeStyle.value
      if (styleState.value !== 'default') {
        const states = { ...(current.states ?? {}) }
        if (Object.keys(next).length)
          states[styleState.value] = next
        else delete states[styleState.value]
        activeStyle.value = {
          ...current,
          states: Object.keys(states).length ? states : undefined,
        }
        return
      }

      if (viewport.value !== 'base') {
        // Store only what diverges from the inherited value — a field equal to
        // what it inherits stays inherited rather than being copied down.
        const inherited = inheritedStyles(current, viewport.value) as Record<
          string,
          unknown
        >
        const override: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(next)) {
          if (value !== inherited[key])
            override[key] = value
        }
        const responsive = { ...(current.responsive ?? {}) }
        if (Object.keys(override).length)
          responsive[viewport.value] = override as BaseBlockStyles
        else delete responsive[viewport.value]
        activeStyle.value = {
          ...current,
          responsive: Object.keys(responsive).length ? responsive : undefined,
        }
        return
      }

      activeStyle.value = {
        ...next,
        states: current.states,
        responsive: current.responsive,
      } as BlockStyles
    },
  })

  return { blockSlice }
}
