import { describe, expect, it } from 'vitest'
import { uframeIntegration, UFRAME_VITE_STYLES_ID } from './index'

describe('uframeIntegration', () => {
  it('serves the published-page stylesheet through the documented virtual import', () => {
    const plugin = uframeIntegration()
    const resolved = (plugin.resolveId as (id: string) => string | undefined)(UFRAME_VITE_STYLES_ID)
    expect(resolved).toBe('\0uframe:integrations:vite.css')

    expect(plugin.load).toBeTypeOf('function')
  })
})
