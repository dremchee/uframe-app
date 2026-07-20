<script setup lang="ts">
import type { HeadingBlockProps } from '@/core'
import { computed } from 'vue'

const p = defineProps<{
  props: HeadingBlockProps
}>()

const tagName = computed(() => `h${p.props.level ?? 2}`)
const content = computed(() => p.props.content)
</script>

<template>
  <component :is="tagName" class="uf-heading-block">
    {{ content }}
  </component>
</template>
