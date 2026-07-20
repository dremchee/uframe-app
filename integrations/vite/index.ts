import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { formatCss } from '../../src/core/utils/css-format'
import styles from '../../src/styles/page-reset.css?raw'

/** Side-effect import resolved by {@link uframeIntegration}. */
export const UFRAME_VITE_STYLES_ID = '@uframe/integrations/vite'
const RESOLVED_UFRAME_VITE_STYLES_ID = '\0uframe:integrations:vite.css'
const stylesPath = fileURLToPath(new URL('../../src/styles/page-reset.css', import.meta.url))
// `formatCss` expects serializer output without comments. The page-reset
// header is source documentation only, so remove it before formatting CSS for
// the consumer's virtual module.
const formattedStyles = formatCss(styles.replace(/\/\*[\s\S]*?\*\//g, ''))

interface PluginContext {
  addWatchFile: (id: string) => void
}

interface ViteServer {
  moduleGraph: {
    getModuleById: (id: string) => unknown
  }
}

/** Structurally compatible with Vite's `Plugin`, without shipping Vite's type graph. */
export interface UframeIntegrationPlugin {
  name: string
  enforce: 'pre'
  resolveId: (id: string) => string | undefined
  load: (this: PluginContext, id: string) => string | undefined
  handleHotUpdate: (context: { file: string, server: ViteServer }) => unknown[] | undefined
}

/**
 * Serves uframe's published-page base styles as a Vite virtual CSS module.
 *
 * ```ts
 * // vite.config.ts
 * plugins: [uframeIntegration()]
 *
 * // page entry
 * import '@uframe/integrations/vite'
 * ```
 */
export function uframeIntegration(): UframeIntegrationPlugin {
  return {
    name: 'uframe-integration',
    enforce: 'pre',
    resolveId(id) {
      if (id === UFRAME_VITE_STYLES_ID)
        return RESOLVED_UFRAME_VITE_STYLES_ID
    },
    load(id) {
      if (id === RESOLVED_UFRAME_VITE_STYLES_ID) {
        if (existsSync(stylesPath))
          this.addWatchFile(stylesPath)
        return formattedStyles
      }
    },
    handleHotUpdate({ file, server }) {
      if (!existsSync(stylesPath) || file !== stylesPath)
        return
      const module = server.moduleGraph.getModuleById(RESOLVED_UFRAME_VITE_STYLES_ID)
      return module ? [module] : []
    },
  }
}
