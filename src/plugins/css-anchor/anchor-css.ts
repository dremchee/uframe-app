import type { PageDocument } from '@/core'
import { blockStyleValue, visitBlockTree } from '@/core'

export const ANCHOR_PLACEMENTS = [
  'top left',
  'top',
  'top right',
  'left',
  'right',
  'bottom left',
  'bottom',
  'bottom right',
] as const

export type AnchorPlacement = typeof ANCHOR_PLACEMENTS[number]
export type AnchorFlip = 'flip-block' | 'flip-inline'

export interface AnchorCandidate {
  name: string
  blockId: string
  blockName?: string
  blockType: string
}

/** Conservative dashed-ident validation for author-created anchor names. */
export function isAnchorName(value: string): boolean {
  return /^--[a-z_][\w-]*$/i.test(value.trim())
}

/** Normalizes user input to a portable CSS <dashed-ident>. */
export function normalizeAnchorName(value: string, fallback = 'anchor'): string {
  let slug = value
    .trim()
    .replace(/^--/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (/^\d/.test(slug))
    slug = `anchor-${slug}`
  return `--${slug || fallback}`
}

/** Stable default for a block without leaking arbitrary id punctuation. */
export function anchorNameForBlock(blockId: string): string {
  return normalizeAnchorName(`anchor-${blockId}`)
}

/** Names currently exposed by rendered blocks, including class-authored names. */
export function collectAnchorCandidates(document: PageDocument): AnchorCandidate[] {
  const candidates: AnchorCandidate[] = []
  const styles = document.styles ?? {}
  visitBlockTree(document.blocks, (block) => {
    const raw = blockStyleValue(block, styles, 'anchorName')
    if (typeof raw !== 'string')
      return
    for (const name of raw.trim().split(/\s+/).filter(isAnchorName)) {
      candidates.push({
        name,
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
      })
    }
  })
  return candidates
}

export function anchorFlipState(value: string | undefined): Record<AnchorFlip, boolean> {
  const tokens = new Set((value ?? '').split(/[\s,]+/).filter(Boolean))
  return {
    'flip-block': tokens.has('flip-block'),
    'flip-inline': tokens.has('flip-inline'),
  }
}

/** Produces useful overflow tactics, including the corner case when both axes flip. */
export function composeAnchorFallbacks(block: boolean, inline: boolean): string | undefined {
  if (block && inline)
    return 'flip-block, flip-inline, flip-block flip-inline'
  if (block)
    return 'flip-block'
  if (inline)
    return 'flip-inline'
  return undefined
}
