import { describe, expect, it } from 'vitest'
import { UFRAME_PROTOCOL_VERSION, withProtocolVersion } from './protocol'

describe('withProtocolVersion', () => {
  it('preserves the message payload while adding the current protocol version', () => {
    expect(withProtocolVersion({ type: 'uframe:requestSave' })).toEqual({
      type: 'uframe:requestSave',
      v: UFRAME_PROTOCOL_VERSION,
    })
  })
})
