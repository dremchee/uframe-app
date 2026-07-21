// SSR frontend for uframe templates. Defaults are intentionally minimal — the
// whole app's job is to resolve a PageDocument and render it server-side.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // SSR is the point of this app (server renders the resolved template).
  ssr: true,
  devtools: { enabled: false },
  // `uframe` ships prebuilt ESM; transpiling lets Nuxt's Vite process the
  // bundled Vue block components (renderComponent) cleanly during SSR.
  build: {
    transpile: ['@dremchee/uframe'],
  },
  runtimeConfig: {
    // Server-only Directus access token (set NUXT_DIRECTUS_TOKEN). Empty →
    // the API routes fall back to the bundled sample so the app still runs.
    directusToken: '',
    public: {
      // Directus base URL (set NUXT_PUBLIC_DIRECTUS_URL).
      directusUrl: 'http://localhost:8055',
    },
  },
})
