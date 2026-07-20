<script setup lang="ts">
import type { CalloutProps } from './schema'
import { calloutTones } from './schema'

// Settings component shown in the Content tab. Bind to the block props via
// defineModel — the editor wires two-way updates and history for you.
const model = defineModel<CalloutProps>({ required: true })
</script>

<template>
  <div class="uf-callout-settings">
    <label>
      <span>Tone</span>
      <select v-model="model.tone">
        <option v-for="tone in calloutTones" :key="tone" :value="tone">
          {{ tone }}
        </option>
      </select>
    </label>

    <label>
      <span>Text</span>
      <textarea v-model="model.text" rows="3" />
    </label>
  </div>
</template>

<style scoped>
.uf-callout-settings {
  display: grid;
  gap: 0.5rem;
}
.uf-callout-settings label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.85rem;
}
.uf-callout-settings select,
.uf-callout-settings textarea {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--uf-border, #e2e8f0);
  border-radius: 0.375rem;
  font: inherit;
}
</style>
