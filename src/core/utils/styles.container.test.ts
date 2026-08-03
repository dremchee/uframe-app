import type { BlockStyles } from '@/core/types/block-styles'
import type { PageDocument } from '@/core/types/page-document'
import { describe, expect, it } from 'vitest'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'
import { serializeDocumentStyles } from '@/core/utils/styles'

function documentWithStyle(style?: BlockStyles): PageDocument {
  return {
    id: 'container-document',
    title: 'Container document',
    version: 1,
    updatedAt: '',
    settings: { width: 'responsive', background: '#fff' },
    blocks: [{
      id: 'card',
      type: 'div',
      props: {},
      ...(style ? { style } : {}),
    }],
  }
}

describe('pageDocumentSchema container variants', () => {
  it('serializes the container on a parent and the query on its descendant', () => {
    const document: PageDocument = {
      ...documentWithStyle(),
      blocks: [{
        id: 'card',
        type: 'div',
        props: {},
        style: { containerType: 'inline-size', containerName: 'card' },
        children: [{
          id: 'title',
          type: 'heading',
          props: {},
          style: {
            containerResponsive: {
              compact: {
                container: 'card',
                direction: 'max',
                width: 480,
                style: { fontSize: '18px' },
              },
            },
          },
        }],
      }],
    }

    const css = serializeDocumentStyles(document)
    expect(css).toContain('.uf-block-card { container-type: inline-size; container-name: card }')
    expect(css).toContain('@container card (width <= 480px) { .uf-block-title { font-size: 18px } }')
  })

  it('round-trips a query container and descendant variant', () => {
    const document = documentWithStyle({
      containerType: 'inline-size',
      containerName: 'card',
      containerResponsive: {
        compact: {
          container: 'card',
          direction: 'max',
          width: 480,
          style: { fontSize: '18px', display: 'grid' },
        },
      },
    })

    const parsed = pageDocumentSchema.parse(JSON.parse(JSON.stringify(document)))
    expect(parsed.blocks[0]?.style).toEqual(document.blocks[0]?.style)
  })

  it('keeps legacy documents without container fields valid', () => {
    const parsed = pageDocumentSchema.parse(documentWithStyle({ display: 'flex' }))
    expect(parsed.blocks[0]?.style).toEqual({ display: 'flex' })
  })

  it('rejects invalid container names and widths', () => {
    expect(pageDocumentSchema.safeParse(documentWithStyle({
      containerType: 'inline-size',
      containerName: '1bad',
    })).success).toBe(false)
    expect(pageDocumentSchema.safeParse(documentWithStyle({
      containerResponsive: {
        broken: {
          container: 'card',
          direction: 'max',
          width: 0,
          style: {},
        },
      },
    })).success).toBe(false)
  })
})
