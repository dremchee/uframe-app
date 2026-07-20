import type { ShallowRef } from 'vue'
import type { BreakpointDef, GlobalSettings, PageDocument, StyleViewport } from '@/core'
import { computed } from 'vue'
import { createUniqueName, resolveBreakpoints, sanitizeVarName } from '@/core'

export interface UseEditorBreakpointsOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  editBreakpoint: ShallowRef<StyleViewport>
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
}

/**
 * Owns breakpoint definitions and their persistence. Viewport sizing remains
 * with the editor because it is a canvas-only concern.
 */
export function useEditorBreakpoints(options: UseEditorBreakpointsOptions) {
  const { document, globals, editBreakpoint, commit, commitGlobals } = options
  const breakpoints = computed<BreakpointDef[]>(() => resolveBreakpoints({
    breakpoints: globals.value ? globals.value.breakpoints : document.value.settings.breakpoints,
  }))

  function commitBreakpoints(list: BreakpointDef[]) {
    if (globals.value)
      commitGlobals({ ...globals.value, breakpoints: list })
    else
      commit({ ...document.value, settings: { ...document.value.settings, breakpoints: list } })
  }

  function hasDuplicateRange(candidate: Omit<BreakpointDef, 'id'>, excludeId?: string) {
    return breakpoints.value.some((breakpoint) => {
      if (breakpoint.id === excludeId || breakpoint.direction !== candidate.direction || breakpoint.width !== candidate.width)
        return false
      return breakpoint.direction !== 'between' || breakpoint.widthMax === candidate.widthMax
    })
  }

  function addBreakpoint(fields?: Partial<Omit<BreakpointDef, 'id'>>): string | undefined {
    const index = breakpoints.value.length + 1
    const label = fields?.label?.trim() || `Breakpoint ${index}`
    const id = createUniqueName(sanitizeVarName(label) || 'bp', breakpoints.value.map(breakpoint => breakpoint.id), '')
    const direction = fields?.direction ?? 'max'
    const breakpoint: BreakpointDef = {
      id,
      label,
      direction,
      width: fields?.width ?? 600,
      ...(direction === 'between' ? { widthMax: fields?.widthMax ?? (fields?.width ?? 600) * 2 } : {}),
    }
    if (hasDuplicateRange(breakpoint))
      return undefined

    commitBreakpoints([...breakpoints.value, breakpoint])
    return id
  }

  function updateBreakpoint(id: string, patch: Partial<Omit<BreakpointDef, 'id'>>): boolean {
    const current = breakpoints.value.find(breakpoint => breakpoint.id === id)
    if (!current)
      return false
    const next = { ...current, ...patch }
    if (hasDuplicateRange(next, id))
      return false

    commitBreakpoints(breakpoints.value.map(breakpoint => (breakpoint.id === id ? next : breakpoint)))
    return true
  }

  function removeBreakpoint(id: string) {
    commitBreakpoints(breakpoints.value.filter(breakpoint => breakpoint.id !== id))
    if (editBreakpoint.value === id)
      editBreakpoint.value = 'base'
  }

  function resetBreakpoints() {
    if (globals.value)
      commitGlobals({ ...globals.value, breakpoints: undefined })
    else
      commit({ ...document.value, settings: { ...document.value.settings, breakpoints: undefined } })
    editBreakpoint.value = 'base'
  }

  return {
    breakpoints,
    addBreakpoint,
    updateBreakpoint,
    removeBreakpoint,
    resetBreakpoints,
  }
}
