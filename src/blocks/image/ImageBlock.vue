<script setup lang="ts">
import type { ImageBlockProps } from '@/core'

const props = defineProps<{
  props: ImageBlockProps
}>()
</script>

<template>
  <figure class="uf-image-block">
    <img v-if="props.props.src" :src="props.props.src" :alt="props.props.alt ?? ''">
    <div v-else class="uf-image-placeholder">
      Image
    </div>
    <figcaption v-if="props.props.caption">
      {{ props.props.caption }}
    </figcaption>
  </figure>
</template>
