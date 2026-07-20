// Use uframe's built style-string entry instead of importing a raw CSS file
// into Nuxt's server module graph.
import { exportBaseStyles as pageBaseCss } from 'uframe/styles/page-frame'

export { pageBaseCss }
