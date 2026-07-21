import type { AssetPick, AssetRef, GlobalSettings, PageBlock, PageDocument, ResolveContext } from '@dremchee/uframe/core'
import type { UframeEditorHandle } from '@dremchee/uframe/embed'
import type { Ref } from 'vue'
import { useApi } from '@directus/extensions-sdk'
import { assetKey, collectDataRequirements } from '@dremchee/uframe/core'
import { ref } from 'vue'
import { toNormalizedSchema } from '../interface/schema'

/** A Directus Files row exposed by the media picker. */
export interface DirectusFileRow {
  id: string
  title?: string
  type?: string
  width?: number
  height?: number
}

export interface UframeDirectusPickerState {
  open: boolean
  requestId: string
  loading: boolean
  files: DirectusFileRow[]
}

export interface UseUframeDirectusBridgeOptions {
  editor: Ref<UframeEditorHandle | null>
}

/**
 * Shared Directus integration for the field interface and the left-bar module.
 *
 * It owns only the CMS bridge: schema introspection, data/assets context,
 * globals persistence, and the Files picker. Record/page CRUD remains in the
 * host component because the module and interface intentionally have different
 * persistence semantics.
 */
export function useUframeDirectusBridge({ editor }: UseUframeDirectusBridgeOptions) {
  const api = useApi()
  const apiRoot = (api.defaults.baseURL ?? '').replace(/\/$/, '')

  const picker = ref<UframeDirectusPickerState>({
    open: false,
    requestId: '',
    loading: false,
    files: [],
  })

  function assetUrl(asset: AssetRef): string {
    const transform = asset.transform
    const params = new URLSearchParams()
    if (transform?.width)
      params.set('width', String(transform.width))
    if (transform?.height)
      params.set('height', String(transform.height))
    if (transform?.fit)
      params.set('fit', transform.fit)
    if (transform?.format)
      params.set('format', transform.format)
    const query = params.toString()
    return `${apiRoot}/assets/${asset.id}${query ? `?${query}` : ''}`
  }

  function collectAssets(doc: PageDocument): Record<string, string> {
    const assets: Record<string, string> = {}
    const walk = (blocks: PageBlock[]) => {
      for (const block of blocks) {
        if (block.asset)
          assets[assetKey(block.asset)] = assetUrl(block.asset)
        if (block.children?.length)
          walk(block.children)
      }
    }
    walk(doc.blocks)
    return assets
  }

  async function loadSchema() {
    try {
      const [collections, fields, relations] = await Promise.all([
        api.get('/collections', { params: { limit: -1 } }),
        api.get('/fields', { params: { limit: -1 } }),
        api.get('/relations', { params: { limit: -1 } }),
      ])
      editor.value?.setSchema(toNormalizedSchema(
        collections.data?.data ?? [],
        fields.data?.data ?? [],
        relations.data?.data ?? [],
      ))
    }
    catch {
      // Schema introspection is optional; bindings simply stay minimal.
    }
  }

  let requirementsSignature: string | null = null
  let lastData: Record<string, unknown> = {}

  async function refreshData(doc: PageDocument) {
    const assets = collectAssets(doc)
    const requirements = collectDataRequirements(doc)
    const signature = JSON.stringify(requirements)
    if (signature === requirementsSignature) {
      editor.value?.setDataContext({ data: lastData, assets } satisfies ResolveContext)
      return
    }
    requirementsSignature = signature

    const data: Record<string, unknown> = {}
    await Promise.all(requirements.map(async (requirement) => {
      try {
        const response = await api.get(`/items/${requirement.source.collection}`, {
          params: {
            limit: requirement.kind === 'list' ? (requirement.source.limit ?? 10) : 1,
            sort: requirement.source.sort?.join(','),
            fields: '*.*',
          },
        })
        const payload = response.data?.data
        data[requirement.blockId] = requirement.kind === 'list'
          ? (Array.isArray(payload) ? payload : [])
          : (Array.isArray(payload) ? payload[0] : payload)
      }
      catch {
        // Preview falls back to authored values when a collection is unavailable.
      }
    }))
    lastData = data
    editor.value?.setDataContext({ data, assets } satisfies ResolveContext)
  }

  async function loadGlobals(): Promise<GlobalSettings | undefined> {
    try {
      const response = await api.get('/items/uframe_globals')
      const document = response.data?.data?.document
      return document && typeof document === 'object' ? document as GlobalSettings : undefined
    }
    catch {
      return undefined
    }
  }

  async function saveGlobals(globals: GlobalSettings) {
    try {
      await api.patch('/items/uframe_globals', { document: globals })
    }
    catch {
      // Globals are optional; a missing or read-only collection is non-fatal.
    }
  }

  async function openPicker(requestId: string, kind: 'image' | 'file') {
    picker.value = { open: true, requestId, loading: true, files: [] }
    try {
      const response = await api.get('/files', {
        params: {
          limit: 60,
          sort: '-uploaded_on',
          fields: 'id,title,type,width,height',
          filter: kind === 'image' ? { type: { _starts_with: 'image/' } } : undefined,
        },
      })
      picker.value.files = (response.data?.data ?? []) as DirectusFileRow[]
    }
    catch {
      picker.value.files = []
    }
    finally {
      picker.value.loading = false
    }
  }

  function thumbUrl(id: string): string {
    return assetUrl({ source: 'directus', id, transform: { width: 240, height: 160, fit: 'cover' } })
  }

  function selectFile(file: DirectusFileRow) {
    const asset: AssetRef = { source: 'directus', id: file.id, mime: file.type }
    const pick: AssetPick = {
      ref: asset,
      url: assetUrl(asset),
      meta: { width: file.width, height: file.height, mime: file.type, alt: file.title },
    }
    editor.value?.setAsset(picker.value.requestId, pick)
    picker.value.open = false
  }

  function cancelPicker() {
    editor.value?.setAsset(picker.value.requestId, null)
    picker.value.open = false
  }

  return {
    picker,
    assetUrl,
    collectAssets,
    loadSchema,
    refreshData,
    loadGlobals,
    saveGlobals,
    openPicker,
    thumbUrl,
    selectFile,
    cancelPicker,
  }
}
