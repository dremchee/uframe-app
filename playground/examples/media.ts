import type { AssetPick, AssetRef } from '@'

// A fake media library for the dev playground — stands in for a real CMS's
// native media drawer (Directus Files etc.). Assets are deterministic inline
// SVGs keyed by id, so a picked asset still resolves after a reload.

export interface MockAsset {
  id: string
  label: string
  fill: string
}

export const mockAssets: MockAsset[] = [
  { id: 'hero', label: 'Hero', fill: '#6366f1' },
  { id: 'mountains', label: 'Mountains', fill: '#0ea5e9' },
  { id: 'forest', label: 'Forest', fill: '#10b981' },
  { id: 'sunset', label: 'Sunset', fill: '#f59e0b' },
  { id: 'abstract', label: 'Abstract', fill: '#ec4899' },
  { id: 'mono', label: 'Mono', fill: '#334155' },
]

function svg(fill: string, label: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="100%" height="100%" fill="${fill}"/><text x="50%" y="50%" fill="#ffffff" font-family="sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
  )}`
}

/** Resolver the host supplies via `dataContext` — id → preview/render URL. */
export function resolveMockAsset(ref: AssetRef): string | undefined {
  if (ref.source !== 'mock')
    return undefined
  const asset = mockAssets.find(a => a.id === ref.id)
  return asset ? svg(asset.fill, asset.label) : undefined
}

/** What the host returns from the picker for a chosen asset. */
export function mockAssetPick(id: string): AssetPick {
  const asset = mockAssets.find(a => a.id === id)!
  return {
    ref: { source: 'mock', id },
    url: svg(asset.fill, asset.label),
    meta: { alt: asset.label, width: 640, height: 400 },
  }
}
