import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
// This smoke test reads Astro's build output without a Vite transform pipeline.
// eslint-disable-next-line test/no-import-node-test
import test from 'node:test'

test('builds the published Astro component with bindings, repeated data, CSS and fonts', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  assert.match(html, /<!DOCTYPE html>/i)
  assert.match(html, /<title>uframe &amp; Astro<\/title>/)
  assert.match(html, /Rendered with Astro/)
  assert.match(html, /Static pages/)
  assert.match(html, /Server rendering/)
  assert.match(html, /#0f766e/)
  assert.match(html, /fonts.googleapis.com/)
  assert.match(html, /name="description"/)
  assert.doesNotMatch(html, /astro-island|<script|data-astro-cid/)
})
