<script setup lang="ts">
import type { HtmlAttributes } from '@/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Hosts a framework-neutral block: a registered custom element (`tag`) authored
// in any framework. Props are pushed in; the element renders itself. Used by
// CanvasBlockRenderer when a definition provides `element` instead of a Vue
// `renderComponent`. Leaf blocks only for now (no child slotting).
const props = defineProps<{
  tag: string
  blockProps: Record<string, unknown>
  // Per-block style class + applied named classes (so `.uf-block-<id>` rules and
  // the block's `css` apply); placed on the custom element itself.
  elementClass?: string[]
  elementAttributes?: HtmlAttributes
}>()

const host = ref<HTMLElement | null>(null)
let el: HTMLElement | null = null
let mirroredPropAttributes = new Set<string>()
let appliedElementAttributes = new Set<string>()

function syncProps() {
  if (!el)
    return
  const nextMirrored = new Set<string>()
  for (const [key, value] of Object.entries(props.blockProps)) {
    // Push as a DOM property so objects/arrays survive; also mirror primitives to
    // attributes so elements that read attributes (observedAttributes) update.
    try {
      (el as unknown as Record<string, unknown>)[key] = value
    }
    catch {}
    if (value == null) {
      el.removeAttribute(key)
    }
    else if (typeof value !== 'object') {
      el.setAttribute(key, String(value))
      nextMirrored.add(key)
    }
  }
  for (const key of mirroredPropAttributes) {
    if (!nextMirrored.has(key) && !(key in (props.elementAttributes ?? {})))
      el.removeAttribute(key)
  }
  mirroredPropAttributes = nextMirrored
}

function syncAttrs() {
  if (!el)
    return
  el.className = (props.elementClass ?? []).join(' ')
  const next = props.elementAttributes ?? {}
  for (const name of appliedElementAttributes) {
    if (!(name in next) && !mirroredPropAttributes.has(name))
      el.removeAttribute(name)
  }
  for (const [name, value] of Object.entries(next)) {
    el.setAttribute(name, value)
  }
  appliedElementAttributes = new Set(Object.keys(next))
}

onMounted(() => {
  // Create in THIS realm's document — that's where the plugin called
  // customElements.define, so the element upgrades here. Appending it into the
  // (cross-document) canvas adopts the already-upgraded element, which keeps its
  // behaviour and reactions.
  el = document.createElement(props.tag)
  syncAttrs()
  syncProps()
  host.value?.appendChild(el)
})

watch(() => props.blockProps, () => {
  syncAttrs()
  // Definition props are the semantic source of truth on name collisions.
  syncProps()
}, { deep: true })
watch([() => props.elementClass, () => props.elementAttributes], () => {
  syncAttrs()
  syncProps()
}, { deep: true })

onBeforeUnmount(() => {
  el?.remove()
  el = null
})
</script>

<template>
  <div ref="host" style="display: contents" />
</template>
