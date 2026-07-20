<svelte:options customElement={{ tag: 'uf-callout-svelte', shadow: 'none' }} />

<script lang="ts">
  // Svelte 5 compiles this straight to a custom element (auto-registered on
  // import). `shadow: 'none'` keeps it in light DOM, so the block's CSS — from the
  // co-located `callout.css` set on the definition's `css` field — applies by
  // class. Default shadow DOM would block those document-level class rules and
  // force styles inside the component, breaking the single source of truth.
  // Display-only; editing is the editor's schema-driven settings form.
  import type { CalloutTone } from './shared'

  let { tone = 'info', text = 'Heads up!' }: { tone?: CalloutTone, text?: string } = $props()
</script>

<div class="uf-callout-block uf-callout-block--{tone}">
  {text || 'Callout text…'}
</div>
