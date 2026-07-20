import { sampleDocument } from '../../data/sample-document'
import { listUframePages } from '../utils/directus'

// Page list for the index nav. Directus-backed when a token is set, else the
// single bundled sample.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const cfg = { url: config.public.directusUrl, token: config.directusToken }

  const sample = { source: 'sample' as const, pages: [{ id: sampleDocument.id, title: sampleDocument.title }] }
  // Token optional (public read works without it); only the URL is required.
  if (!cfg.url)
    return sample

  try {
    return { source: 'directus' as const, pages: await listUframePages(cfg) }
  }
  catch (error) {
    return { ...sample, error: (error as Error).message }
  }
})
