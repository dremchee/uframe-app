import type { PageDocument } from '@/core/types/page-document'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPageDocument } from '@/core/utils/document-tree'
import { createLocalStorageAdapter, createMemoryStorageAdapter } from '@/core/utils/storage'

function makeDoc(partial?: Partial<PageDocument>): PageDocument {
  return createPageDocument({ id: 'p', title: 'Test', ...partial })
}

function installLocalStorageMock() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
  })
  return store
}

describe('createMemoryStorageAdapter', () => {
  it('returns null by default', () => {
    const adapter = createMemoryStorageAdapter()
    expect(adapter.load()).toBeNull()
  })

  it('returns the seed if provided', () => {
    const seed = makeDoc({ title: 'Seed' })
    const adapter = createMemoryStorageAdapter(seed)
    expect(adapter.load()).toEqual(seed)
  })

  it('saves and reads back', () => {
    const adapter = createMemoryStorageAdapter()
    const doc = makeDoc({ title: 'Saved' })
    adapter.save(doc)
    expect(adapter.load()).toEqual(doc)
  })

  it('clears the current snapshot', () => {
    const adapter = createMemoryStorageAdapter(makeDoc({ title: 'Saved' }))
    adapter.clear?.()
    expect(adapter.load()).toBeNull()
  })
})

describe('createLocalStorageAdapter', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = installLocalStorageMock()
  })

  it('returns null when nothing is stored', () => {
    const adapter = createLocalStorageAdapter('my-page')
    expect(adapter.load()).toBeNull()
  })

  it('round-trips a document through localStorage', () => {
    const adapter = createLocalStorageAdapter('my-page')
    const doc = makeDoc({ title: 'Round trip' })
    adapter.save(doc)

    expect(store.get('my-page')).toContain('"title":"Round trip"')
    expect(adapter.load()).toEqual(doc)
  })

  it('returns null for invalid JSON', () => {
    store.set('my-page', '{not json')
    const adapter = createLocalStorageAdapter('my-page')
    expect(adapter.load()).toBeNull()
  })

  it('returns null for JSON that fails schema validation', () => {
    store.set('my-page', JSON.stringify({ id: '', title: 'X' }))
    const adapter = createLocalStorageAdapter('my-page')
    expect(adapter.load()).toBeNull()
  })

  it('clears the saved document', () => {
    const adapter = createLocalStorageAdapter('my-page')
    adapter.save(makeDoc({ title: 'Saved' }))
    adapter.clear?.()
    expect(store.has('my-page')).toBe(false)
  })
})
