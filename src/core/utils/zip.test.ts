import { describe, expect, it } from 'vitest'
import { crc32, createZip } from '@/core/utils/zip'

describe('zip', () => {
  it('computes the IEEE crc32', () => {
    const data = new TextEncoder().encode('The quick brown fox jumps over the lazy dog')
    expect(crc32(data)).toBe(0x414FA339)
    expect(crc32(new Uint8Array())).toBe(0)
  })

  it('writes a store-only archive with a valid layout', async () => {
    const blob = createZip([
      { name: 'index.html', content: '<!doctype html>' },
      { name: 'styles.css', content: 'body{margin:0}' },
    ], new Date(2026, 0, 2, 3, 4, 6))

    const bytes = new Uint8Array(await blob.arrayBuffer())
    const view = new DataView(bytes.buffer)

    // Local header for the first file.
    expect(view.getUint32(0, true)).toBe(0x04034B50)
    expect(view.getUint16(8, true)).toBe(0) // STORE
    expect(view.getUint32(14, true)).toBe(crc32(new TextEncoder().encode('<!doctype html>')))
    expect(view.getUint16(26, true)).toBe('index.html'.length)

    // End of central directory: entry count + central directory bounds.
    const eocd = bytes.length - 22
    expect(view.getUint32(eocd, true)).toBe(0x06054B50)
    expect(view.getUint16(eocd + 8, true)).toBe(2)
    const centralSize = view.getUint32(eocd + 12, true)
    const centralStart = view.getUint32(eocd + 16, true)
    expect(centralStart + centralSize).toBe(eocd)
    expect(view.getUint32(centralStart, true)).toBe(0x02014B50)
  })
})
