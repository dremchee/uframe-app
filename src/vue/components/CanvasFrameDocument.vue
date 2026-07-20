<script setup lang="ts">
import type { BlockRegistry, PageDocument, ResolveContext } from '@/core'
import type { I18n } from '@/vue/i18n'
import { computed, provide } from 'vue'
import CanvasBlockRenderer from '@/vue/components/CanvasBlockRenderer.vue'
import { useBlockStylesheet } from '@/vue/composables/style/useBlockStylesheet'
import { embedTrustKey } from '@/vue/context/embed-trust'
import { provideUframeI18nContext, useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  document: PageDocument
  registry: BlockRegistry
  editable?: boolean
  ownerDocument: Document | null
  /** In-place symbol editing: id of the editable subtree root (else null). */
  editScopeRootId?: string | null
  /** Host sample data for bound-prop + Data List previews. */
  dataContext?: ResolveContext
  /** Resolved preview URLs for picked media assets, keyed by assetKey(ref). */
  assetPreviews?: Record<string, string>
  /** Render embed blocks in a sandboxed iframe (untrusted document). */
  untrustedEmbeds?: boolean
  emptyLabel?: string
  slotFallbackLabel?: (name: string) => string
  selectOptionFallbackLabel?: string
  circularComponentLabel?: string
  missingComponentLabel?: string
  unknownBlockLabel?: (type: string) => string
  i18n?: I18n
}>()

useBlockStylesheet(() => props.document, () => props.ownerDocument, () => props.registry)

// Provided here (the canvas render-tree root) rather than via the editor context
// — the canvas is mounted with a standalone `render()`, which the editor's
// app-level provides don't reach into. The embed block injects this.
provide(embedTrustKey, () => props.untrustedEmbeds === true)
const i18n = props.i18n ?? useUframeI18n()
if (props.i18n)
  provideUframeI18nContext(props.i18n)

const { t } = i18n
const emptyLabel = computed(() => props.emptyLabel ?? t('canvas.empty'))
const selectOptionFallbackLabel = computed(() => props.selectOptionFallbackLabel ?? t('canvas.selectOptionFallback'))
const circularComponentLabel = computed(() => props.circularComponentLabel ?? t('canvas.circularComponent'))
const missingComponentLabel = computed(() => props.missingComponentLabel ?? t('canvas.missingComponent'))
const slotFallbackLabel = computed(() => props.slotFallbackLabel ?? ((name: string) => t('canvas.slotFallback', { name })))
const unknownBlockLabel = computed(() => props.unknownBlockLabel ?? ((type: string) => t('canvas.unknownBlock', { type })))
</script>

<template>
  <CanvasBlockRenderer
    v-for="block in document.blocks"
    :key="block.id"
    :block="block"
    :registry="registry"
    :symbols="document.symbols"
    :editable="editable"
    :edit-scope-root-id="editScopeRootId"
    :in-edit-scope="editScopeRootId == null"
    :data-context="dataContext"
    :asset-previews="assetPreviews"
    :circular-component-label="circularComponentLabel"
    :missing-component-label="missingComponentLabel"
    :unknown-block-label="unknownBlockLabel"
    :slot-fallback-label="slotFallbackLabel"
    :select-option-fallback-label="selectOptionFallbackLabel"
  />
  <div v-if="!document.blocks.length" class="uf-canvas-empty">
    {{ emptyLabel }}
  </div>
</template>
