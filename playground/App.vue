<script setup lang="ts">
import type { AssetPick, AssetRequest, GlobalSettings, PageDocument } from '@'
import { PageEditor, safeParseGlobalSettings } from '@'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { shallowRef, watch } from 'vue'
import { aiPlugin } from '@/plugins/ai'
import { dynamicTemplate, mockDataContext, mockSchema } from './examples/dynamic-content'
import { mockAssetPick, mockAssets, resolveMockAsset } from './examples/media'
import { pageTemplates, stripPageGlobals, templateGlobals } from './examples/templates'
import '../src/styles/editor.css'

// Multi-page demo: seed the editor with ready-made page templates (Landing
// first). The dynamic-content demo page (Data List / Data Item + bindings) sits
// last, with mock CMS schema + sample data so the Bindings UI and canvas preview
// are live when you switch to it.
// Pages defer their globals (variables / breakpoints / classes / symbols /
// page defaults) to a shared SITE so editing them is global across the set;
// `stripPageGlobals` removes the per-page copies and `templateGlobals()` is the
// shared seed (the editor merges the two back at render time).
const defaults: PageDocument[] = [...pageTemplates, dynamicTemplate].map(stripPageGlobals)

// Dev persistence: the playground has no backend, so edits would vanish on
// reload. Mirror the shared globals + page set + active page id to localStorage
// (content edits flow through the single `v-model`, structural ones through
// `v-model:pages`, globals through `v-model:globals`) and restore on load. Bump
// the key suffix when the seed templates change shape.
const STORAGE_KEY = 'uframe-playground:v4'

function loadSaved(): { globals?: GlobalSettings, pages: PageDocument[], activePageId?: string } | null {
  if (typeof localStorage === 'undefined')
    return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed?.pages) && parsed.pages.length && parsed.pages.every((p: PageDocument) => p?.id && Array.isArray(p.blocks)))
      return parsed
  }
  catch {}
  return null
}

const saved = loadSaved()
const pages = shallowRef<PageDocument[]>(saved?.pages ?? defaults)
const activePageId = shallowRef<string>(
  saved?.activePageId && pages.value.some(p => p.id === saved.activePageId)
    ? saved.activePageId
    : pages.value[0]?.id ?? dynamicTemplate.id,
)
// Shared context for the whole page set (design tokens / breakpoints / classes /
// symbols / page defaults). Run any persisted globals through the schema so a
// legacy shape (e.g. variables stored before stable `key`s) is migrated — the
// cssVariable schema backfills `key = name`. Falls back to a fresh seed.
function loadGlobals(raw: unknown): GlobalSettings {
  if (raw) {
    const parsed = safeParseGlobalSettings(raw)
    if (parsed.success)
      return parsed.data as GlobalSettings
  }
  return templateGlobals()
}
const globals = shallowRef<GlobalSettings>(loadGlobals(saved?.globals))
// Live active-page document — the only place per-block content edits surface.
const activeDocument = shallowRef<PageDocument>()

function save() {
  if (typeof localStorage === 'undefined')
    return
  const doc = activeDocument.value
  const set = doc ? pages.value.map(p => (p.id === doc.id ? doc : p)) : pages.value
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ globals: globals.value, pages: set, activePageId: activePageId.value }))
}
const persist = useDebounceFn(save, 300)

watch([pages, activePageId, activeDocument, globals], persist)
// The debounced write is dropped if the tab unloads before it fires (e.g. select
// a page, then reload right away). Flush synchronously on pagehide so the active
// page + page set always land in storage.
useEventListener(window, 'pagehide', save)

// Mock media drawer: stands in for the CMS's native picker. `requestAsset`
// opens the overlay and resolves once the user picks (or cancels).
const pickerOpen = shallowRef(false)
let resolvePick: ((pick: AssetPick | null) => void) | null = null

function requestAsset(_req: AssetRequest): Promise<AssetPick | null> {
  pickerOpen.value = true
  return new Promise((resolve) => {
    resolvePick = resolve
  })
}

function choose(id: string) {
  resolvePick?.(mockAssetPick(id))
  resolvePick = null
  pickerOpen.value = false
}

function cancelPick() {
  resolvePick?.(null)
  resolvePick = null
  pickerOpen.value = false
}
</script>

<template>
  <PageEditor
    v-model="activeDocument"
    v-model:pages="pages"
    v-model:active-page-id="activePageId"
    v-model:globals="globals"
    :plugins="[aiPlugin]"
    :schema="mockSchema"
    :data-context="mockDataContext"
    :request-asset="requestAsset"
  />

  <!-- Mock CMS media drawer -->
  <div
    v-if="pickerOpen"
    class="media-picker-backdrop"
    @click.self="cancelPick"
  >
    <div class="media-picker">
      <header class="media-picker__head">
        <strong>Media library (mock)</strong>
        <button type="button" class="media-picker__close" @click="cancelPick">
          ✕
        </button>
      </header>
      <div class="media-picker__grid">
        <button
          v-for="a in mockAssets"
          :key="a.id"
          type="button"
          class="media-picker__item"
          @click="choose(a.id)"
        >
          <img :src="resolveMockAsset({ source: 'mock', id: a.id })" :alt="a.label">
          <span>{{ a.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 50%);
}
.media-picker {
  width: min(560px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgb(15 23 42 / 35%);
  overflow: hidden;
}
.media-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}
.media-picker__close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
}
.media-picker__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}
.media-picker__item {
  display: grid;
  gap: 6px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  text-align: center;
  transition: border-color 0.15s;
}
.media-picker__item:hover {
  border-color: #6366f1;
}
.media-picker__item img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
}
.media-picker__item span {
  font-size: 12px;
  color: #475569;
  padding-bottom: 8px;
}
</style>
