<script setup lang="ts">
import type { InputBlockProps } from '@/core'

const props = defineProps<{
  props: InputBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <input
    class="uf-input-block uf-no-click"
    :type="props.props.type ?? 'text'"
    :name="props.props.name"
    :placeholder="props.props.placeholder || undefined"
    :value="props.props.value ?? ''"
    :required="props.props.required || undefined"
    :disabled="props.props.disabled || undefined"
    @input.stop
  >
</template>
