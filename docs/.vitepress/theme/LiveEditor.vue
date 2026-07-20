<script setup lang="ts">
import type { GlobalSettings, PageDocument } from '@/core'
import type { UframeEditorHandle } from '@/embed/client'
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { safeParseGlobalSettings } from '@/core'
import { createUframeEditor } from '@/embed/client'
import { dynamicTemplate, mockDataContext, mockSchema } from '../../../playground/examples/dynamic-content'
import { pageTemplates, stripPageGlobals, templateGlobals } from '../../../playground/examples/templates'

// Follow VitePress's appearance (which itself follows the system preference) so
// the embedded editor switches dark/light in step with the docs.
const { isDark } = useData()

// This is the real thing: the editor runs inside an <iframe> driven by the
// framework-agnostic `uframe/embed` client — exactly the integration shown in
// the docs. The editor app is served from docs/public/embed (built by
// `docs:embed`). Importing the client is SSR-safe; it only touches the DOM here,
// in onMounted (client-only).
const host = ref<HTMLElement>()
const expanded = ref(false)

let editor: UframeEditorHandle | undefined

// Seed: ready-made page templates with Landing first; the dynamic-content page
// (CMS bindings) sits last. Mirrors the dev playground's default order.
// Pages defer their globals (variables / breakpoints / classes / symbols /
// defaults) to a shared context; `stripPageGlobals` drops the per-page copies,
// `templateGlobals()` is the shared seed (merged back at render time).
const DEFAULT_PAGES: PageDocument[] = [...pageTemplates, dynamicTemplate].map(stripPageGlobals)
const STORAGE_KEY = 'uframe-docs-demo:v2'

// Persist the visitor's tinkering (page set + active page + content edits) and
// restore it on reload — same behaviour as the dev playground. The embed client
// reports changes via onChange / onPagesChange / onActivePageChange; we mirror
// them locally and write a debounced snapshot.
let pages: PageDocument[] = DEFAULT_PAGES
let activePageId: string = pageTemplates[0]!.id
let globals: GlobalSettings = templateGlobals()

function loadSaved(): { globals?: GlobalSettings, pages: PageDocument[], activePageId?: string } | null {
  if (typeof localStorage === 'undefined')
    return null
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(parsed?.pages) && parsed.pages.length
      && parsed.pages.every((p: PageDocument) => p?.id && Array.isArray(p.blocks))) {
      return parsed
    }
  }
  catch {}
  return null
}

function save() {
  if (typeof localStorage === 'undefined')
    return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ globals, pages, activePageId }))
}

// Debounced; flushed synchronously on pagehide / unmount so a fresh page switch
// is never lost to a quick reload.
let saveTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 300)
}

// Expand into a fixed overlay covering the whole page (not the native
// Fullscreen API) so the editor floats above the docs layout and Escape closes
// it like any modal. Lock body scroll while open.
function toggle() {
  expanded.value = !expanded.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && expanded.value)
    expanded.value = false
}

watch(expanded, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  // Restore the saved snapshot if present; otherwise seed the defaults (Landing
  // first, the dynamic-content page last).
  const saved = loadSaved()
  if (saved) {
    pages = saved.pages
    activePageId = saved.activePageId && saved.pages.some(p => p.id === saved.activePageId)
      ? saved.activePageId
      : saved.pages[0]!.id
    // Migrate any legacy persisted globals (e.g. variables without stable keys).
    if (saved.globals) {
      const parsed = safeParseGlobalSettings(saved.globals)
      if (parsed.success)
        globals = parsed.data as GlobalSettings
    }
  }
  editor = createUframeEditor({
    target: host.value!,
    src: `${import.meta.env.BASE_URL}embed/index.html`,
    pages,
    activePageId,
    globals,
    theme: isDark.value ? 'dark' : 'light',
    // Load the official AI plugin as a real URL plugin — the same `plugins`
    // path any host uses. It's co-built with the embed app, so it shares the
    // editor's runtime (Vue + context) and its slots light up on register.
    // Visitors can try generation with their own provider key (local prefs only).
    plugins: [`${import.meta.env.BASE_URL}embed/plugins/ai.js`],
    schema: mockSchema,
    // Only the serializable `data` crosses the embed: `mockDataContext` also
    // carries a `resolveAsset` *function*, which structured-clone (postMessage)
    // can't send — including it makes the whole setDataContext message fail and
    // the bindings render empty. The demo's covers are inline data URIs in the
    // sample rows, so no asset resolver is needed here.
    dataContext: { data: mockDataContext.data },
    // Persist content edits / structural changes / page switches as they happen.
    onChange: (page) => {
      pages = pages.map(p => (p.id === page.id ? page : p))
      persist()
    },
    onPagesChange: (next, active) => {
      pages = next
      activePageId = active
      persist()
    },
    onActivePageChange: (id) => {
      activePageId = id
      persist()
    },
    onGlobalsChange: (next) => {
      globals = next
      persist()
    },
  })
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', save)
})

// Keep the editor in sync when the docs theme (or system preference) flips.
watch(isDark, dark => editor?.setTheme(dark ? 'dark' : 'light'))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', save)
  document.body.style.overflow = ''
  clearTimeout(saveTimer)
  save()
  editor?.destroy()
})
</script>

<template>
  <div ref="host" class="uframe-live" :class="{ 'uframe-live--expanded': expanded }">
    <button
      type="button"
      class="uframe-live__toggle"
      :title="expanded ? 'Collapse' : 'Expand'"
      :aria-label="expanded ? 'Collapse' : 'Expand'"
      @click="toggle"
    >
      <svg v-if="expanded" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Break out of the doc's centered prose column to use the viewport width,
   keeping comfortable horizontal gutters. */
.uframe-live {
  --uframe-gutter: 32px;
  position: relative;
  left: 50%;
  width: calc(100vw - 2 * var(--uframe-gutter));
  margin-left: calc(-50vw + var(--uframe-gutter));
  height: calc(100vh - var(--vp-nav-height) - 32px);
  min-height: 560px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  /* Elevation + brand glow so the demo reads as the hero of the page. Negative
     spreads keep the horizontal reach within the 32px gutter (no x-scrollbar). */
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.08),
    0 30px 60px -30px rgba(15, 23, 42, 0.45),
    0 14px 56px -26px rgba(99, 102, 241, 0.78),
    0 0 44px -14px rgba(139, 92, 246, 0.66),
    0 0 22px -8px rgba(99, 102, 241, 0.6);
  transition: box-shadow 0.3s ease;
}

/* Stronger, cooler glow on the dark docs theme. */
.dark .uframe-live {
  box-shadow:
    0 30px 60px -30px rgba(0, 0, 0, 0.6),
    0 14px 56px -26px rgba(99, 102, 241, 0.9),
    0 0 46px -16px rgba(139, 92, 246, 0.8),
    0 0 24px -8px rgba(129, 140, 248, 0.7);
}

/* Float above the whole layout (nav included) as a fixed overlay. */
.uframe-live--expanded {
  position: fixed;
  inset: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  min-height: 0;
  margin-left: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.uframe-live__toggle {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.uframe-live__toggle:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}
</style>
