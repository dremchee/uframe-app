import type { PageDocument } from '@/core'
import { describe, expect, it } from 'vitest'
import { isAutomaticContainerName, nextContainerName } from './container-names'

function documentWithStyles(styles: PageDocument['styles']): PageDocument {
  return {
    id: 'page',
    title: 'Page',
    version: 1,
    blocks: [],
    settings: { width: 'responsive', background: '' },
    styles,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('container names', () => {
  it('increments the highest automatic name across style layers', () => {
    const document = documentWithStyles({
      one: { containerType: 'inline-size', containerName: 'container-1' },
      custom: { containerType: 'inline-size', containerName: 'content-card' },
      responsive: {
        responsive: {
          mobile: { containerType: 'inline-size', containerName: 'container-3' },
        },
      },
    })

    expect(nextContainerName(document)).toBe('container-4')
  })

  it('recognizes only sequential automatic names', () => {
    expect(isAutomaticContainerName('container-2')).toBe(true)
    expect(isAutomaticContainerName('container-card')).toBe(false)
    expect(isAutomaticContainerName(undefined)).toBe(false)
  })
})
