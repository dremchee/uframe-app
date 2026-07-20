<script setup lang="ts">
import type { ButtonBlockProps } from '@/core'
import { computed } from 'vue'

const props = defineProps<{
  props: ButtonBlockProps
}>()

const kind = computed(() => props.props.kind ?? 'link')
// 'submit' / 'reset' / 'button' all render a real <button> with the matching
// `type` attribute; 'link' (default) keeps the historical <a href> output.
const buttonType = computed(() => (kind.value === 'link' ? undefined : kind.value))
</script>

<template>
  <a v-if="kind === 'link'" class="uf-button-block uf-no-click" :href="props.props.href">
    {{ props.props.label }}
  </a>
  <button v-else class="uf-button-block uf-no-click" :type="buttonType">
    {{ props.props.label }}
  </button>
</template>
