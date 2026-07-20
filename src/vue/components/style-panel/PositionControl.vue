<script setup lang="ts">
import type { BaseBlockStyles, CssLength, PositionValue } from '@/core'
import { computed } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  position?: PositionValue
  top?: CssLength
  right?: CssLength
  bottom?: CssLength
  left?: CssLength
}>()

const emit = defineEmits<{
  // Emits a partial patch; the parent's update() deletes keys set to ''.
  update: [patch: Partial<BaseBlockStyles>]
}>()
const { t } = useUframeI18n()

const positionOptions: PositionValue[] = ['static', 'relative', 'absolute', 'fixed', 'sticky']

// Offsets only do anything once the element is taken out of static flow.
const showOffsets = computed(() => !!props.position && props.position !== 'static')

type Side = 'top' | 'right' | 'bottom' | 'left'

// A side is "pinned" when it carries an offset value; unpinned ⇒ auto. Pinning
// from the pad seeds 0; unpinning clears it (parent removes the property).
const sideFields: Array<{ side: Side, letter: string, cell: string }> = [
  { side: 'top', letter: 'T', cell: 'col-start-2 row-start-1' },
  { side: 'left', letter: 'L', cell: 'col-start-1 row-start-2' },
  { side: 'right', letter: 'R', cell: 'col-start-3 row-start-2' },
  { side: 'bottom', letter: 'B', cell: 'col-start-2 row-start-3' },
]

// Pin toggles drawn on each edge of the pad: position + bar shape per side.
const pins: Array<{ side: Side, pos: string, bar: string }> = [
  { side: 'top', pos: 'top-1 left-1/2 -translate-x-1/2', bar: 'w-4 h-0.5' },
  { side: 'bottom', pos: 'bottom-1 left-1/2 -translate-x-1/2', bar: 'w-4 h-0.5' },
  { side: 'left', pos: 'left-1 top-1/2 -translate-y-1/2', bar: 'w-0.5 h-4' },
  { side: 'right', pos: 'right-1 top-1/2 -translate-y-1/2', bar: 'w-0.5 h-4' },
]

function value(side: Side): string {
  return (props[side] as string | undefined) ?? ''
}
function isPinned(side: Side): boolean {
  return value(side) !== ''
}
function setSide(side: Side, next: string) {
  emit('update', { [side]: next })
}
function togglePin(side: Side) {
  setSide(side, isPinned(side) ? '' : '0')
}
</script>

<template>
  <div class="grid gap-2.5">
    <div v-if="showOffsets" class="grid grid-cols-3 grid-rows-3 gap-1.5 items-center">
      <div v-for="field in sideFields" :key="field.side" :class="field.cell">
        <div class="relative">
          <input
            class="w-full h-8 rounded-md border border-uf-border bg-uf-panel-muted pl-2 pr-5 text-[12px] text-uf-text text-center outline-none transition-colors focus:border-uf-accent focus:ring-1 focus:ring-uf-accent"
            :class="!isPinned(field.side) && 'text-uf-muted'"
            inputmode="decimal"
            :value="value(field.side)"
            placeholder="auto"
            :aria-label="field.side"
            @change="event => setSide(field.side, (event.target as HTMLInputElement).value)"
          >
          <span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-uf-muted pointer-events-none">{{ field.letter }}</span>
        </div>
      </div>

      <div class="col-start-2 row-start-2 justify-self-center relative size-20 rounded-md border border-uf-border bg-uf-panel-muted">
        <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-uf-accent" aria-hidden="true" />
        <button
          v-for="pin in pins"
          :key="pin.side"
          type="button"
          :class="cn(
            'absolute rounded-full cursor-pointer transition-colors',
            pin.pos,
            pin.bar,
            isPinned(pin.side) ? 'bg-uf-accent' : 'bg-uf-border hover:bg-uf-text',
          )"
          :aria-label="t('style.pin', { side: pin.side })"
          :aria-pressed="isPinned(pin.side)"
          @click="togglePin(pin.side)"
        />
      </div>
    </div>

    <label class="grid gap-1">
      <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">{{ t('style.type') }}</span>
      <Select
        :model-value="position"
        @update:model-value="value => emit('update', { position: value as PositionValue })"
      >
        <SelectTrigger><SelectValue placeholder="static" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in positionOptions" :key="option" :value="option">{{ option }}</SelectItem>
        </SelectContent>
      </Select>
    </label>
  </div>
</template>
