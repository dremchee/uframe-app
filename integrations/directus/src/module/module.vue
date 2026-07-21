<script setup lang="ts">
import type { GlobalSettings, PageDocument } from '@dremchee/uframe/core'
import type { UframeEditorHandle } from '@dremchee/uframe/embed'
import { useApi } from '@directus/extensions-sdk'
import { createGlobalSettings, createPageDocument } from '@dremchee/uframe/core'
import { createUframeEditor } from '@dremchee/uframe/embed'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useUframeDirectusBridge } from '../shared/useUframeDirectusBridge'

const PAGES = 'uframe_pages'
const GLOBALS = 'uframe_globals'

const api = useApi()

type Id = number | string
interface PageRow { id: Id, title: string, group?: string | null, status?: string | null }

const phase = ref<'checking' | 'setup' | 'ready'>('checking')
const setupBusy = ref(false)
const errorMsg = ref('')

const pages = ref<PageRow[]>([])
const selectedId = ref<Id | null>(null)

const canvas = ref<HTMLElement | null>(null)
const editor = shallowRef<UframeEditorHandle | null>(null)
const {
  picker,
  loadSchema,
  refreshData,
  loadGlobals,
  saveGlobals,
  openPicker,
  thumbUrl,
  selectFile,
  cancelPicker,
} = useUframeDirectusBridge({ editor })
let latestGlobals: GlobalSettings | null = null

function errMessage(e: unknown): string {
  const res = (e as { response?: { data?: { errors?: Array<{ message?: string }> } } }).response
  return res?.data?.errors?.[0]?.message ?? (e as { message?: string }).message ?? 'Something went wrong.'
}

// ── Collection bootstrap ────────────────────────────────────────────────────
async function exists(collection: string): Promise<boolean> {
  try {
    await api.get(`/collections/${collection}`)
    return true
  }
  catch {
    return false
  }
}

function pagesPayload() {
  return {
    collection: PAGES,
    meta: { hidden: true, icon: 'web', note: 'uframe pages (managed by the uframe module)', display_template: '{{ title }}' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'title', type: 'string', meta: { interface: 'input', width: 'full' }, schema: {} },
      { field: 'slug', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'group', type: 'string', meta: { interface: 'input' }, schema: {} },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown' }, schema: { default_value: 'draft' } },
      { field: 'document', type: 'json', meta: { interface: 'uframe-editor', note: 'uframe PageDocument' }, schema: {} },
    ],
  }
}

function globalsPayload() {
  return {
    collection: GLOBALS,
    meta: { hidden: true, singleton: true, icon: 'settings', note: 'uframe shared globals (site-wide variables / breakpoints / classes / symbols / defaults)' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'document', type: 'json', meta: { interface: 'input-code', note: 'GlobalSettings' }, schema: {} },
    ],
  }
}

async function runSetup() {
  setupBusy.value = true
  errorMsg.value = ''
  try {
    if (!(await exists(PAGES)))
      await api.post('/collections', pagesPayload())
    if (!(await exists(GLOBALS)))
      await api.post('/collections', globalsPayload())
    await enterReady()
  }
  catch (e) {
    errorMsg.value = `Couldn't create collections — admin rights required. ${errMessage(e)}`
  }
  finally {
    setupBusy.value = false
  }
}

// ── Pages list (master) ─────────────────────────────────────────────────────
async function loadPages() {
  try {
    const res = await api.get(`/items/${PAGES}`, { params: { fields: 'id,title,group,status', sort: 'title', limit: -1 } })
    pages.value = (res.data?.data ?? []) as PageRow[]
  }
  catch {
    pages.value = []
  }
}

async function enterReady() {
  phase.value = 'ready'
  // Always hand the editor a globals object (loaded, or a fresh empty one) so it
  // runs in shared-context mode and emits globalsChange — otherwise an empty
  // singleton leaves it in single-doc mode and global edits never persist.
  latestGlobals = (await loadGlobals()) ?? createGlobalSettings()
  await loadPages()
  if (pages.value.length)
    await selectPage(pages.value[0]!.id)
}

async function newPage() {
  const doc = createPageDocument({ title: 'Untitled page' })
  try {
    const res = await api.post(`/items/${PAGES}`, { title: doc.title, status: 'draft', document: doc })
    await loadPages()
    const id = res.data?.data?.id as Id | undefined
    if (id != null)
      await selectPage(id)
  }
  catch (e) {
    errorMsg.value = errMessage(e)
  }
}

async function deletePage(id: Id) {
  try {
    await api.delete(`/items/${PAGES}/${id}`)
    await loadPages()
    if (selectedId.value === id) {
      selectedId.value = null
      if (pages.value.length) {
        await selectPage(pages.value[0]!.id)
      }
      else if (editor.value) {
        editor.value.destroy()
        editor.value = null
      }
    }
  }
  catch (e) {
    errorMsg.value = errMessage(e)
  }
}

// ── Inline rename (list) ────────────────────────────────────────────────────
const editingId = ref<Id | null>(null)
const editingTitle = ref('')
// A function :ref re-runs on every re-render (i.e. every keystroke). Guard the
// focus+select with a one-shot flag, or it re-selects the field each keystroke
// and you only keep the last character typed.
let renameJustOpened = false

function focusRename(el: unknown) {
  if (el instanceof HTMLInputElement && renameJustOpened) {
    renameJustOpened = false
    el.focus()
    el.select()
  }
}

function startRename(row: PageRow) {
  editingId.value = row.id
  editingTitle.value = row.title || ''
  renameJustOpened = true
}

function cancelRename() {
  editingId.value = null
}

// Title lives in both the record column (the list) and document.title (export);
// write both so they stay in sync, and push the open editor so it reflects it.
async function commitRename(row: PageRow) {
  if (editingId.value !== row.id)
    return // already committed/cancelled (blur fires after Enter/Esc)
  const title = editingTitle.value.trim()
  editingId.value = null
  if (!title || title === row.title)
    return
  try {
    const res = await api.get(`/items/${PAGES}/${row.id}`, { params: { fields: 'document' } })
    const doc = (res.data?.data?.document ?? createPageDocument({ title })) as PageDocument
    const nextDoc = { ...doc, title }
    await api.patch(`/items/${PAGES}/${row.id}`, { title, document: nextDoc })
    if (row.id === selectedId.value)
      editor.value?.setDocument(nextDoc)
    await loadPages()
  }
  catch (e) {
    errorMsg.value = errMessage(e)
  }
}

// ── Editor (detail) ─────────────────────────────────────────────────────────
async function selectPage(id: Id) {
  selectedId.value = id
  try {
    const res = await api.get(`/items/${PAGES}/${id}`, { params: { fields: 'document' } })
    const doc = (res.data?.data?.document ?? createPageDocument({ title: 'Untitled page' })) as PageDocument
    await mountEditor(doc)
  }
  catch (e) {
    errorMsg.value = errMessage(e)
  }
}

async function mountEditor(doc: PageDocument) {
  await nextTick()
  if (!canvas.value)
    return
  if (!editor.value) {
    editor.value = createUframeEditor({
      target: canvas.value,
      src: '/uframe/index.html',
      document: doc,
      globals: latestGlobals ?? undefined,
      // Auto-save (debounced) so edits persist without relying on a Save button;
      // an explicit Save flushes immediately. Globals go to their singleton.
      onSave: (next) => { void saveCurrent(next) },
      onChange: (next) => {
        void refreshData(next)
        scheduleSaveDoc(next)
      },
      onGlobalsChange: (next) => {
        latestGlobals = next
        scheduleSaveGlobals()
      },
      onRequestAsset: ({ requestId, kind }) => { void openPicker(requestId, kind) },
    })
    // Directus's Splitpanes layout sets `pointer-events: none` on iframes while
    // the mouse is pressed (its resize guard, applied via an `:active` rule that
    // matches any press inside the layout). That makes the editor iframe
    // non-interactive at the exact moment Chrome would begin a native HTML5 drag
    // — so dragging a block never starts. Pin the iframe interactive; inline
    // `!important` beats the stylesheet rule, so native DnD works again.
    editor.value.iframe.style.setProperty('pointer-events', 'auto', 'important')
    void loadSchema()
  }
  else {
    editor.value.setDocument(doc)
  }
  void refreshData(doc)
}

async function saveCurrent(doc: PageDocument) {
  if (selectedId.value == null)
    return
  try {
    await api.patch(`/items/${PAGES}/${selectedId.value}`, { document: doc, title: doc.title })
    if (latestGlobals)
      await saveGlobals(latestGlobals)
    await loadPages() // reflect title renames in the list
  }
  catch (e) {
    errorMsg.value = errMessage(e)
  }
}

// Debounced auto-save: content edits → the active page's document; global edits
// → the shared singleton. Keeps writes reasonable while not depending on Save.
let docTimer: ReturnType<typeof setTimeout> | undefined
let globalsTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSaveDoc(doc: PageDocument) {
  clearTimeout(docTimer)
  docTimer = setTimeout(() => {
    if (selectedId.value == null)
      return
    api.patch(`/items/${PAGES}/${selectedId.value}`, { document: doc, title: doc.title })
      .catch((e: unknown) => { errorMsg.value = errMessage(e) })
  }, 700)
}

function scheduleSaveGlobals() {
  clearTimeout(globalsTimer)
  globalsTimer = setTimeout(() => {
    if (latestGlobals)
      void saveGlobals(latestGlobals)
  }, 700)
}

onMounted(async () => {
  const [p, g] = await Promise.all([exists(PAGES), exists(GLOBALS)])
  if (p && g)
    await enterReady()
  else
    phase.value = 'setup'
})

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})
</script>

<template>
  <private-view title="uframe">
    <template #navigation>
      <div class="uframe-nav">
        <button v-if="phase === 'ready'" type="button" class="uframe-new" @click="newPage">
          + New page
        </button>
        <ul v-if="phase === 'ready'" class="uframe-list">
          <li
            v-for="page in pages"
            :key="page.id"
            class="uframe-list__item"
            :class="{ 'is-active': page.id === selectedId }"
          >
            <input
              v-if="editingId === page.id"
              :ref="focusRename"
              v-model="editingTitle"
              class="uframe-list__rename"
              @keydown.enter.prevent="commitRename(page)"
              @keydown.esc.prevent="cancelRename"
              @blur="commitRename(page)"
            >
            <template v-else>
              <button
                type="button"
                class="uframe-list__open"
                title="Double-click to rename"
                @click="selectPage(page.id)"
                @dblclick="startRename(page)"
              >
                {{ page.title || 'Untitled' }}
                <small v-if="page.group">{{ page.group }}</small>
              </button>
              <button type="button" class="uframe-list__del" title="Delete" @click="deletePage(page.id)">
                ✕
              </button>
            </template>
          </li>
        </ul>
        <p v-if="phase === 'ready' && !pages.length" class="uframe-empty">
          No pages yet.
        </p>
      </div>
    </template>

    <div class="uframe-module">
      <div v-if="phase === 'checking'" class="uframe-center">
        Checking setup…
      </div>

      <div v-else-if="phase === 'setup'" class="uframe-center uframe-setup">
        <h2>Set up uframe</h2>
        <p>
          This creates two hidden collections the module manages —
          <code>uframe_pages</code> (your pages) and <code>uframe_globals</code>
          (site-wide variables, breakpoints, classes, symbols and defaults).
        </p>
        <button type="button" class="uframe-primary" :disabled="setupBusy" @click="runSetup">
          {{ setupBusy ? 'Creating…' : 'Create collections' }}
        </button>
        <p v-if="errorMsg" class="uframe-err">
          {{ errorMsg }}
        </p>
      </div>

      <template v-else>
        <div v-show="selectedId == null" class="uframe-center">
          Select or create a page.
        </div>
        <div v-show="selectedId != null" ref="canvas" class="uframe-canvas" />
        <p v-if="errorMsg" class="uframe-err uframe-err--float">
          {{ errorMsg }}
        </p>
      </template>
    </div>

    <!-- Media picker drawer (Directus Files) -->
    <div v-if="picker.open" class="uframe-media" @click.self="cancelPicker">
      <div class="uframe-media__panel">
        <header class="uframe-media__head">
          <span>Select media</span>
          <button type="button" @click="cancelPicker">
            ✕
          </button>
        </header>
        <div v-if="picker.loading" class="uframe-media__empty">
          Loading…
        </div>
        <div v-else-if="!picker.files.length" class="uframe-media__empty">
          No files found.
        </div>
        <div v-else class="uframe-media__grid">
          <button
            v-for="file in picker.files"
            :key="file.id"
            type="button"
            class="uframe-media__item"
            :title="file.title"
            @click="selectFile(file)"
          >
            <img :src="thumbUrl(file.id)" :alt="file.title ?? ''" loading="lazy">
          </button>
        </div>
      </div>
    </div>
  </private-view>
</template>

<style scoped>
.uframe-module {
  position: relative;
  height: calc(100vh - 60px);
  overflow: hidden;
}
.uframe-canvas {
  width: 100%;
  height: 100%;
}
.uframe-center {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--theme--foreground-subdued, #64748b);
  padding: 24px;
  text-align: center;
}
.uframe-setup {
  max-width: 520px;
  margin: 0 auto;
  gap: 12px;
}
.uframe-setup h2 {
  margin: 0;
  font-weight: 700;
}
.uframe-primary {
  padding: 10px 16px;
  border: 0;
  border-radius: var(--theme--border-radius, 8px);
  background: var(--theme--primary, #6366f1);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
.uframe-primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.uframe-err {
  color: var(--theme--danger, #e11d48);
  font-size: 13px;
}
.uframe-err--float {
  position: absolute;
  left: 12px;
  bottom: 12px;
  margin: 0;
  padding: 8px 12px;
  background: var(--theme--background, #fff);
  border: 1px solid var(--theme--danger, #e11d48);
  border-radius: 8px;
}

/* Navigation (master list) */
.uframe-nav {
  padding: 8px;
}
.uframe-new {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px dashed var(--theme--border-color, #d3dae4);
  border-radius: var(--theme--border-radius, 6px);
  background: transparent;
  color: var(--theme--foreground, #1e293b);
  cursor: pointer;
}
.uframe-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.uframe-list__item {
  display: flex;
  align-items: center;
  border-radius: var(--theme--border-radius, 6px);
}
.uframe-list__item.is-active {
  background: var(--theme--primary-background, rgb(99 102 241 / 10%));
}
.uframe-list__open {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: var(--theme--foreground, #1e293b);
  cursor: pointer;
  text-align: left;
}
.uframe-list__open small {
  color: var(--theme--foreground-subdued, #64748b);
  font-size: 11px;
}
.uframe-list__del {
  border: 0;
  background: transparent;
  color: var(--theme--foreground-subdued, #64748b);
  cursor: pointer;
  padding: 6px 8px;
}
.uframe-list__del:hover {
  color: var(--theme--danger, #e11d48);
}
.uframe-list__rename {
  flex: 1;
  width: 100%;
  margin: 2px;
  padding: 6px 8px;
  border: 1px solid var(--theme--primary, #6366f1);
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--background, #fff);
  color: var(--theme--foreground, #1e293b);
  font: inherit;
  outline: none;
}
.uframe-empty {
  padding: 12px 10px;
  color: var(--theme--foreground-subdued, #64748b);
  font-size: 13px;
}

/* Media picker */
.uframe-media {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 40%);
}
.uframe-media__panel {
  width: min(720px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--theme--background, #fff);
  border-radius: var(--theme--border-radius, 8px);
  overflow: hidden;
  box-shadow: 0 20px 60px rgb(0 0 0 / 35%);
}
.uframe-media__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme--border-color, #e2e8f0);
  font-weight: 600;
}
.uframe-media__head button {
  border: 0;
  background: transparent;
  cursor: pointer;
}
.uframe-media__empty {
  padding: 32px;
  text-align: center;
  color: var(--theme--foreground-subdued, #64748b);
}
.uframe-media__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 16px;
  overflow: auto;
}
.uframe-media__item {
  padding: 0;
  border: 1px solid var(--theme--border-color, #e2e8f0);
  border-radius: var(--theme--border-radius, 8px);
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: 3 / 2;
}
.uframe-media__item:hover {
  border-color: var(--theme--primary, #6366f1);
}
.uframe-media__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
