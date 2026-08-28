<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  name: string
  active?: boolean
  removeLabel: string
}>()

const emit = defineEmits<{
  select: []
  rename: [event: MouseEvent]
  remove: []
}>()

const chipClass = computed(() => props.active
  ? 'border-uf-accent bg-uf-accent text-uf-accent-foreground hover:brightness-95'
  : 'border-uf-accent/35 bg-uf-panel text-uf-accent hover:bg-uf-accent/10')

const removeClass = computed(() => props.active
  ? 'text-uf-accent-foreground/75 hover:bg-black/10 hover:text-uf-accent-foreground'
  : 'opacity-75 hover:bg-uf-accent/20 hover:opacity-100')
</script>

<template>
  <div
    :class="cn(
      'inline-flex items-center gap-1 min-h-5.5 py-0.5 pl-2 pr-1 rounded-sm',
      'border text-[11px] transition-colors',
      chipClass,
    )"
  >
    <button
      type="button"
      class="min-w-0 cursor-pointer text-left"
      @click="emit('select')"
      @dblclick="emit('rename', $event)"
    >
      {{ name }}
    </button>
    <button
      type="button"
      :class="cn('inline-flex h-4 w-4 items-center justify-center rounded-[2px] cursor-pointer', removeClass)"
      :aria-label="removeLabel"
      @click.stop="emit('remove')"
      @dblclick.stop
    >
      <X :size="10" :stroke-width="2" />
    </button>
  </div>
</template>
