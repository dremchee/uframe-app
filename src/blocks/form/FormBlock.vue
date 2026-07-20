<script setup lang="ts">
import type { FormBlockProps } from '@/core'

const props = defineProps<{
  props: FormBlockProps
  hasChildren?: boolean
}>()
</script>

<template>
  <form
    class="uf-form-block"
    :action="props.props.action || undefined"
    :method="props.props.method || 'post'"
    :name="props.props.name || undefined"
    @submit.prevent
  >
    <slot />
    <div v-if="!hasChildren" class="uf-container-placeholder">
      Drop form fields inside
    </div>
  </form>
</template>
