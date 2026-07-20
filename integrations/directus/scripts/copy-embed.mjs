// Copies the built uframe embed app (repo-root build/embed) into this
// extension's dist so the endpoint can serve it from the iframe.
import { cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../../build/embed')
const dest = resolve(here, '../dist/embed')

await rm(dest, { recursive: true, force: true })
await cp(src, dest, { recursive: true })
console.log(`[uframe] copied embed → ${dest}`)
