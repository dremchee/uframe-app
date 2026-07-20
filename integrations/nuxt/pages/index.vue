<script setup lang="ts">
// Lists the available pages (from Directus, or the sample fallback). This page
// renders no template itself, so it keeps its own styling — the global reset is
// only injected by <UframeRenderer> on the [id] route.
const { data } = await useFetch('/api/uframe-pages')
</script>

<template>
  <main class="demo-index">
    <h1>uframe · SSR frontend</h1>
    <p class="src">
      Data source: <strong>{{ data?.source }}</strong>
      <span v-if="data?.error" class="err"> — {{ data.error }} (set <code>NUXT_DIRECTUS_TOKEN</code>)</span>
    </p>
    <ul>
      <li v-for="p in data?.pages" :key="p.id">
        <NuxtLink :to="`/${p.id}`">{{ p.title }}</NuxtLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.demo-index { max-width: 640px; margin: 48px auto; padding: 0 20px; font: 16px/1.6 system-ui, sans-serif; color: #1e293b; }
h1 { font-size: 28px; margin-bottom: 8px; }
.src { color: #64748b; margin-bottom: 16px; }
.err { color: #e11d48; }
code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
ul { list-style: none; padding: 0; display: grid; gap: 8px; }
a { display: block; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; color: #0f766e; text-decoration: none; font-weight: 600; }
a:hover { border-color: #0f766e; }
</style>
