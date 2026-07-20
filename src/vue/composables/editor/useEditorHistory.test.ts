import { describe, expect, it } from 'vitest'
import { createPageDocument } from '@/core'
import { useEditorHistory } from './useEditorHistory'

describe('useEditorHistory', () => {
  it('replaces the active entry without mutating the previous snapshot', () => {
    const initial = createPageDocument({ id: 'initial', title: 'Initial' })
    const next = createPageDocument({ id: 'next', title: 'Next' })
    const replacement = createPageDocument({ id: 'replacement', title: 'Replacement' })
    const history = useEditorHistory(initial)

    history.push(next, null, 'Edit')
    history.replaceCurrent(replacement, null)

    expect(history.entries.value.map(entry => entry.document.id)).toEqual(['initial', 'replacement'])
    expect(history.entries.value[0]?.document).toBe(initial)
  })
})
