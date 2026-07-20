<script setup lang="ts">
import type { GlobalSettings, PageDocument } from 'uframe/core'
import type { UframeEditorHandle } from 'uframe/embed'
import { createPageDocument, validatePageDocument } from 'uframe/core'
import { createUframeEditor } from 'uframe/embed'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useUframeDirectusBridge } from '../shared/useUframeDirectusBridge'

// Directus passes the field value + form state; we emit `input` to write back.
const props = defineProps<{
  value: PageDocument | null
  disabled?: boolean
}>()

const emit = defineEmits<{ input: [value: PageDocument] }>()

const container = ref<HTMLElement | null>(null)
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
// Snapshot of what we last wrote, so an external `value` change (record switch,
// revision revert) is pushed into the editor but our own echo is ignored.
let lastSynced: string | null = null

// Reject foreign / malformed JSON before handing it to the editor.
function toDocument(value: PageDocument | null): PageDocument {
  if (value && validatePageDocument(value).success)
    return value
  return createPageDocument({ title: 'Untitled page' })
}

// ── Shared context (globals) ──────────────────────────────────────────────────
// Site-wide CSS variables / breakpoints / classes / symbols / page defaults live
// in an optional `uframe_globals` singleton (JSON field `document`), shared by
// every page. Absent collection / no permission → single-document mode (each
// page keeps its own globals), so existing setups are unaffected.
let latestGlobals: GlobalSettings | null = null

onMounted(async () => {
  if (!container.value)
    return

  const initial = toDocument(props.value)
  lastSynced = JSON.stringify(initial)
  // Fetch shared globals before mounting so the canvas renders with them from
  // the first frame (no flash of un-themed content).
  const globals = await loadGlobals()
  latestGlobals = globals ?? null

  editor.value = createUframeEditor({
    target: container.value,
    // Served by this extension's bundled endpoint (same Directus origin).
    src: '/uframe/index.html',
    document: JSON.parse(lastSynced) as PageDocument,
    globals,
    readonly: props.disabled,
    // Explicit Save in the editor is the single write into the field; the
    // Directus form's own Save then persists the record (plan §4, decision 6).
    // Shared globals are persisted to their singleton in the same Save action.
    onSave: (doc) => {
      lastSynced = JSON.stringify(doc)
      emit('input', doc)
      if (latestGlobals)
        void saveGlobals(latestGlobals)
    },
    // Live preview: refetch sample data when the set of data blocks changes.
    onChange: (doc) => {
      void refreshData(doc)
    },
    // Track shared-context edits; persisted on Save (above).
    onGlobalsChange: (next) => {
      latestGlobals = next
    },
    // Media: open the Directus Files drawer when the editor asks for an asset.
    onRequestAsset: ({ requestId, kind }) => {
      void openPicker(requestId, kind)
    },
  })

  void loadSchema()
  void refreshData(initial)
})

watch(() => props.value, (next) => {
  if (!editor.value)
    return
  const incoming = JSON.stringify(toDocument(next))
  if (incoming === lastSynced)
    return
  lastSynced = incoming
  editor.value.setDocument(JSON.parse(incoming) as PageDocument)
  void refreshData(JSON.parse(incoming) as PageDocument)
})

watch(() => props.disabled, ro => editor.value?.setReadonly(Boolean(ro)))

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})
</script>

<template>
  <div ref="container" class="uframe-interface" />

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
</template>

<style scoped>
.uframe-interface {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  overflow: hidden;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
}

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
  border-bottom: var(--theme--border-width, 1px) solid var(--theme--border-color, #e2e8f0);
  font-weight: 600;
}
.uframe-media__head button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
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
  border: var(--theme--border-width, 1px) solid var(--theme--border-color, #e2e8f0);
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
