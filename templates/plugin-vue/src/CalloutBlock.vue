<script setup lang="ts">
import type { CalloutProps } from './schema'

// Canvas render component — display-only; editing is the schema-driven settings
// form. Styles live in the <style> below (normal SFC authoring) and are lifted
// into the definition's `css` field via `./CalloutBlock.vue?uframe-css` (see
// index.ts), so the editor injects them into the canvas iframe + export.
defineProps<{ props: CalloutProps }>()
</script>

<template>
  <div class="uf-callout-block" :class="`uf-callout-block--${props.tone}`">
    {{ props.text || 'Callout text…' }}
  </div>
</template>

<!-- NOT scoped: the same rules must match renderHtml's plain classes in the
     export. Colors are CSS variables with fallbacks — set `--callout-*` in the
     editor's Variables panel to retheme. -->
<style>
.uf-callout-block {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid transparent;
  font-size: 0.95rem;
  line-height: 1.5;
}
.uf-callout-block--info { background: var(--callout-info-bg, #eff6ff); border-color: var(--callout-info-border, #3b82f6); color: var(--callout-info-fg, #1e3a8a); }
.uf-callout-block--success { background: var(--callout-success-bg, #ecfdf5); border-color: var(--callout-success-border, #10b981); color: var(--callout-success-fg, #065f46); }
.uf-callout-block--warning { background: var(--callout-warning-bg, #fffbeb); border-color: var(--callout-warning-border, #f59e0b); color: var(--callout-warning-fg, #92400e); }
.uf-callout-block--danger { background: var(--callout-danger-bg, #fef2f2); border-color: var(--callout-danger-border, #ef4444); color: var(--callout-danger-fg, #991b1b); }
</style>
