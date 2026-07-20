<script setup lang="ts">
import type { TextAreaBlockProps } from '@/core'

const props = defineProps<{
  props: TextAreaBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <textarea
    class="uf-textarea-block uf-no-click"
    :name="props.props.name"
    :placeholder="props.props.placeholder || undefined"
    :rows="props.props.rows ?? 4"
    :required="props.props.required || undefined"
    :disabled="props.props.disabled || undefined"
  />
</template>
