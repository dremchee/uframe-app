import { sampleContext, sampleDocument } from '../../data/sample-document'
import { loadUframePage } from '../utils/directus'

// Returns a page ready for <UframeRenderer>: { document, context }. Backed by
// Directus when a token is configured; otherwise the bundled sample, so the
// app runs out of the box.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const cfg = { url: config.public.directusUrl, token: config.directusToken }
  const id = getQuery(event).id as string | undefined

  const sample = {
    source: 'sample' as const,
    id: sampleDocument.id,
    title: sampleDocument.title,
    document: sampleDocument,
    context: sampleContext,
  }

  // Try Directus whenever a URL is configured. The token is optional — public
  // read works without it; it's only sent when present. Fall back to the sample
  // if Directus is unreachable or denies access.
  if (!cfg.url)
    return sample

  try {
    return { source: 'directus' as const, ...(await loadUframePage(cfg, id)) }
  }
  catch (error) {
    return { ...sample, error: (error as Error).message }
  }
})
