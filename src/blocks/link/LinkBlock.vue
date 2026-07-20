<script setup lang="ts">
import type { LinkBlockProps } from '@/core'
import { computed } from 'vue'

const props = defineProps<{
  props: LinkBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()

// Default rel for external _blank targets — protects against the
// noopener/noreferrer footgun without forcing the user to remember it.
const rel = computed(() => {
  if (props.props.rel)
    return props.props.rel
  if (props.props.target === '_blank')
    return 'noopener noreferrer'
  return undefined
})
</script>

<template>
  <a
    class="uf-link-block uf-no-click"
    :href="props.props.href || '#'"
    :target="props.props.target"
    :rel="rel"
  >
    <slot />
    <span v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      Drop blocks inside this link
    </span>
  </a>
</template>
