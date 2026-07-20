<script setup lang="ts">
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
  elementId?: string
}>()

const host = ref<HTMLElement | null>(null)
let el: HTMLElement | null = null

function syncProps() {
  if (!el)
    return
  for (const [key, value] of Object.entries(props.blockProps)) {
    // Push as a DOM property so objects/arrays survive; also mirror primitives to
    // attributes so elements that read attributes (observedAttributes) update.
    try {
      (el as unknown as Record<string, unknown>)[key] = value
    }
    catch {}
    if (value == null)
      el.removeAttribute(key)
    else if (typeof value !== 'object')
      el.setAttribute(key, String(value))
  }
}

function syncAttrs() {
  if (!el)
    return
  el.className = (props.elementClass ?? []).join(' ')
  if (props.elementId)
    el.id = props.elementId
  else
    el.removeAttribute('id')
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

watch(() => props.blockProps, syncProps, { deep: true })
watch([() => props.elementClass, () => props.elementId], syncAttrs, { deep: true })

onBeforeUnmount(() => {
  el?.remove()
  el = null
})
</script>

<template>
  <div ref="host" style="display: contents" />
</template>
