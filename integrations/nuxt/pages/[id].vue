<script setup lang="ts">
import { computed } from 'vue'
import { useUframePage } from '../composables/useUframePage'

// Renders one stored page (by route id) server-side. Two renderers are
// available: <UframeDocument> (recursive Vue components, default) and
// <UframeRenderer> (string HTML) — toggle with ?r=html.
const route = useRoute()
const { data } = await useUframePage(() => String(route.params.id))
const mode = computed(() => (route.query.r === 'html' ? 'html' : 'components'))

const linkBase = 'padding:6px 10px;border-radius:8px;font:13px/1 system-ui,sans-serif;text-decoration:none;background:#0f766e;color:#fff'
const linkMuted = 'padding:6px 10px;border-radius:8px;font:13px/1 system-ui,sans-serif;text-decoration:none;background:#e2e8f0;color:#334155'
</script>

<template>
  <div>
    <!-- Inline styles so the toolbar survives the page's injected global reset. -->
    <nav style="position:fixed;top:12px;left:12px;z-index:9999;display:flex;gap:8px">
      <NuxtLink to="/" :style="linkBase">
        ← pages
      </NuxtLink>
      <NuxtLink :to="`/${route.params.id}`" :style="mode === 'components' ? linkBase : linkMuted">
        components
      </NuxtLink>
      <NuxtLink :to="`/${route.params.id}?r=html`" :style="mode === 'html' ? linkBase : linkMuted">
        html
      </NuxtLink>
    </nav>

    <template v-if="data">
      <UframeDocument
        v-if="mode === 'components'"
        :document="data.document"
        :context="data.context"
      />
      <UframeRenderer
        v-else
        :document="data.document"
        :context="data.context"
      />
    </template>
  </div>
</template>
