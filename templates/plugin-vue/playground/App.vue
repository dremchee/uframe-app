<script setup lang="ts">
import type { PageDocument } from '@dremchee/uframe'
import { PageEditor } from '@dremchee/uframe'
import { shallowRef } from 'vue'
// Import the plugin by SOURCE (not the built dist) so Vite HMR applies to the
// block/settings components while you edit them.
import { calloutPlugin } from '../src'
import '@dremchee/uframe/styles.css'

const document = shallowRef<PageDocument>()
</script>

<template>
  <!-- Mount the real editor with the plugin registered build-time. Adding the
       plugin to :plugins is the DEV wiring; in prod the editor loads the built
       dist by path instead — the plugin object itself is the same. -->
  <PageEditor v-model="document" :plugins="[calloutPlugin]" autosave-key="plugin-dev" />
</template>
