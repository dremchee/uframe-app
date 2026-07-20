import { describe, expect, it } from 'vitest'
import { useEditorRequests } from './useEditorRequests'

describe('useEditorRequests', () => {
  it('increments the nonce when the same intent is repeated', () => {
    const requests = useEditorRequests()

    requests.requestEditClass('card')
    requests.requestEditClass('card')

    expect(requests.editClassRequest.value).toEqual({ name: 'card', nonce: 2 })
  })

  it('keeps independent channels and ignores empty targets', () => {
    const requests = useEditorRequests()

    requests.requestRevealBlock('hero')
    requests.requestRevealInTree('footer')
    requests.requestRevealBlock(null)

    expect(requests.revealBlockRequest.value).toEqual({ id: 'hero', nonce: 1 })
    expect(requests.revealInTreeRequest.value).toEqual({ id: 'footer', nonce: 1 })
  })
})
