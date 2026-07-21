import type { PageDocument, ResolveContext } from '@dremchee/uframe/core'

export interface UframePagePayload {
  source: 'directus' | 'sample'
  id: string | number
  title: string
  document: PageDocument
  context: ResolveContext
  error?: string
}

/**
 * Loads a page (template + the data its bindings need) via the server API. That
 * route is Directus-backed when `NUXT_DIRECTUS_TOKEN` is set and falls back to
 * the bundled sample otherwise — so this composable is the single seam the UI
 * talks to, regardless of source.
 */
export function useUframePage(id?: MaybeRefOrGetter<string | undefined>) {
  // Normalise to a computed ref so useFetch unwraps it into the query (a bare
  // getter passed as a query *value* isn't unwrapped) and refetches on change.
  const idRef = computed(() => toValue(id))
  return useFetch<UframePagePayload>('/api/uframe-page', {
    query: { id: idRef },
    key: () => `uframe-page-${idRef.value ?? 'default'}`,
  })
}
