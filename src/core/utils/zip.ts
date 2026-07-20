/**
 * Minimal ZIP writer — STORE only (no compression). Exports bundle a handful
 * of text files, where deflate would save little; writing the container by
 * hand keeps a compressor dependency out of the library bundle.
 */

export interface ZipFile {
  /** Forward-slash relative path inside the archive. */
  name: string
  content: string
}

let crcTable: Uint32Array | undefined

function getCrcTable(): Uint32Array {
  if (crcTable)
    return crcTable
  crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++)
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c >>> 0
  }
  return crcTable
}

export function crc32(data: Uint8Array): number {
  const table = getCrcTable()
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++)
    crc = table[(crc ^ data[i]!) & 0xFF]! ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/** Local time in MS-DOS format (the ZIP spec's timestamp encoding). */
function dosDateTime(now: Date): { time: number, date: number } {
  return {
    time: ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xFFFF,
    date: (((Math.max(now.getFullYear(), 1980) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF,
  }
}

export function createZip(files: ZipFile[], now = new Date()): Blob {
  const encoder = new TextEncoder()
  const { time, date } = dosDateTime(now)

  const parts: Uint8Array[] = []
  let offset = 0
  const push = (bytes: Uint8Array) => {
    parts.push(bytes)
    offset += bytes.length
  }
  const record = (size: number) => {
    const bytes = new Uint8Array(size)
    return { bytes, view: new DataView(bytes.buffer) }
  }

  const entries: Array<{ name: Uint8Array, size: number, crc: number, offset: number }> = []

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    entries.push({ name, size: data.length, crc, offset })

    const { bytes, view } = record(30)
    view.setUint32(0, 0x04034B50, true) // local file header
    view.setUint16(4, 20, true) // version needed
    view.setUint16(6, 0x0800, true) // UTF-8 file names
    view.setUint16(8, 0, true) // STORE
    view.setUint16(10, time, true)
    view.setUint16(12, date, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true) // compressed = uncompressed
    view.setUint32(22, data.length, true)
    view.setUint16(26, name.length, true)
    push(bytes)
    push(name)
    push(data)
  }

  const centralStart = offset
  for (const entry of entries) {
    const { bytes, view } = record(46)
    view.setUint32(0, 0x02014B50, true) // central directory header
    view.setUint16(4, 20, true) // version made by
    view.setUint16(6, 20, true) // version needed
    view.setUint16(8, 0x0800, true)
    view.setUint16(10, 0, true)
    view.setUint16(12, time, true)
    view.setUint16(14, date, true)
    view.setUint32(16, entry.crc, true)
    view.setUint32(20, entry.size, true)
    view.setUint32(24, entry.size, true)
    view.setUint16(28, entry.name.length, true)
    view.setUint32(42, entry.offset, true)
    push(bytes)
    push(entry.name)
  }
  const centralSize = offset - centralStart

  const { bytes, view } = record(22)
  view.setUint32(0, 0x06054B50, true) // end of central directory
  view.setUint16(8, entries.length, true)
  view.setUint16(10, entries.length, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralStart, true)
  push(bytes)

  return new Blob(parts as BlobPart[], { type: 'application/zip' })
}
