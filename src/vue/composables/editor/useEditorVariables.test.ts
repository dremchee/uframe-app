import type { GlobalSettings } from '@/core'
import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { createPageDocument } from '@/core'
import { useEditorVariables } from './useEditorVariables'

function createVariables(globalsValue: GlobalSettings | null = null) {
  const document = shallowRef(createPageDocument({ variables: [] }))
  const globals = shallowRef<GlobalSettings | null>(globalsValue)
  const variables = useEditorVariables({
    document,
    globals,
    commit: (next) => { document.value = next },
    commitGlobals: (next) => { globals.value = next },
  })
  return { document, globals, variables }
}

describe('useEditorVariables', () => {
  it('keeps the generated CSS key stable while changing the display name', () => {
    const state = createVariables()
    const key = state.variables.addVariable({ name: 'Brand color', value: '#14b8a6' })

    expect(key).toBe('Brand-color')
    expect(state.variables.renameVariable(0, 'Primary brand')).toBe(true)
    expect(state.variables.variables.value).toEqual([{
      key: 'Brand-color',
      name: 'Primary brand',
      value: '#14b8a6',
      type: 'color',
    }])
  })

  it('writes shared variables to globals and preserves the local document', () => {
    const state = createVariables({ version: 1, updatedAt: '2026-01-01T00:00:00.000Z', variables: [] })

    state.variables.addVariable({ name: 'Space', value: '8px', type: 'size' })

    expect(state.globals.value?.variables).toEqual([{
      key: 'Space',
      name: 'Space',
      value: '8px',
      type: 'size',
    }])
    expect(state.document.value.variables).toBeUndefined()
  })
})
