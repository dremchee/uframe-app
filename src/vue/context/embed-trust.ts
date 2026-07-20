import type { InjectionKey } from 'vue'
import { inject } from 'vue'

/**
 * Whether the canvas is rendering an untrusted document — provided by
 * CanvasFrameDocument and read by the embed block so it can isolate raw author
 * HTML in a sandboxed iframe. A getter (not a bare boolean) so it stays reactive
 * across the standalone `render()` tree, which has no app-level provides.
 */
export type UntrustedEmbeds = () => boolean

export const embedTrustKey: InjectionKey<UntrustedEmbeds> = Symbol('uframe:untrustedEmbeds')

/** Reads the untrusted-embeds flag; defaults to trusted (`false`). */
export function useUntrustedEmbeds(): UntrustedEmbeds {
  return inject(embedTrustKey, () => false)
}
