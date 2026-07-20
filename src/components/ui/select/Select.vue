<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { SelectRoot } from 'reka-ui'

const model = defineModel<AcceptableValue>()
</script>

<template>
  <SelectRoot v-model="model">
    <slot />
  </SelectRoot>
</template>
