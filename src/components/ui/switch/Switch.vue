<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label
    :class="cn(
      'inline-flex items-center gap-2 text-sm font-medium select-none',
      disabled ? 'opacity-50' : 'cursor-pointer',
      props.class,
    )"
  >
    <SwitchRoot
      v-model="model"
      :disabled="disabled"
      class="inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uf-accent focus-visible:ring-offset-2
        disabled:cursor-not-allowed
        data-[state=checked]:bg-uf-accent data-[state=unchecked]:bg-uf-border"
    >
      <SwitchThumb
        class="pointer-events-none block size-4 rounded-full bg-white shadow-xs ring-0 transition-transform
          data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </SwitchRoot>
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>
