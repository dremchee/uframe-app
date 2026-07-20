import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineEndpoint } from '@directus/extensions-sdk'

// Serves the bundled uframe embed app (copied to dist/embed at build time).
// The interface points its <iframe> at  /<directus>/uframe/index.html
// Implemented with node:fs only — no extra runtime dependency.
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

export default defineEndpoint((router) => {
  const embedDir = fileURLToPath(new URL('./embed', import.meta.url))

  router.get(/.*/, async (req, res) => {
    // Strip query, default to index.html, prevent path traversal.
    const rel = normalize(decodeURIComponent(req.path)).replace(/^(\.\.[/\\])+/, '')
    const file = join(embedDir, rel === '/' || rel === '' ? 'index.html' : rel)

    if (!file.startsWith(embedDir)) {
      res.status(403).end()
      return
    }

    try {
      const info = await stat(file)
      if (!info.isFile()) {
        res.status(404).end()
        return
      }
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
      createReadStream(file).pipe(res)
    }
    catch {
      res.status(404).end()
    }
  })
})
