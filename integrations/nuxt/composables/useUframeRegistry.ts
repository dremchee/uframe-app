import type { BlockRegistry } from 'uframe/core'
import { defaultBlockDefinitions } from 'uframe/blocks'
import { createBlockRegistry } from 'uframe/core'

// The default block manifest is static, so build the type→definition index once
// and reuse it for every render (and across SSR requests — it's immutable). The
// renderer only reads each definition's `renderHtml` / `css`; the Vue
// `renderComponent` + icons come along but are unused on the render path.
let registry: BlockRegistry | null = null

export function useUframeRegistry(): BlockRegistry {
  registry ??= createBlockRegistry(defaultBlockDefinitions)
  return registry
}
