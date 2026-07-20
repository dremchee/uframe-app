<script setup lang="ts">
import { Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUframeI18n } from '@/vue/i18n'

type Side = 'top' | 'right' | 'bottom' | 'left'
type SelectedSide = Side | 'all'

const props = defineProps<{
  modelValue: SelectedSide
  modifiedSides?: Side[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SelectedSide]
}>()

const { t } = useUframeI18n()

const sideGlyph: Record<Side, { square: string, bar: string }> = {
  top: { square: 'top-[5px] border-t-0 rounded-t-none', bar: 'left-0 right-0 top-0 h-[2px]' },
  bottom: { square: 'bottom-[5px] border-b-0 rounded-b-none', bar: 'left-0 right-0 bottom-0 h-[2px]' },
  left: { square: 'left-[5px] border-l-0 rounded-l-none', bar: 'top-0 bottom-0 left-0 w-[2px]' },
  right: { square: 'right-[5px] border-r-0 rounded-r-none', bar: 'top-0 bottom-0 right-0 w-[2px]' },
}

function isActive(side: SelectedSide) {
  return props.modelValue === side
}

function isModified(side: Side) {
  return props.modifiedSides?.includes(side) ?? false
}

function sideBtnClass(side: SelectedSide) {
  return cn(
    'inline-flex items-center justify-center size-9 rounded-lg cursor-pointer transition-colors',
    isActive(side) ? 'bg-uf-accent/10' : 'hover:bg-white',
  )
}

function sideSquareClass(side: Side) {
  return isActive(side) || isModified(side) ? 'border-uf-accent' : 'border-uf-muted/60'
}

function sideBarClass(side: Side) {
  return isActive(side) || isModified(side) ? 'bg-uf-accent' : 'bg-uf-muted'
}
</script>

<template>
  <div class="grid gap-1.5">
    <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">{{ t('style.bordersSide') }}</span>
    <div class="grid grid-cols-3 gap-1.5 mx-auto rounded-2xl bg-muted p-1">
      <span />
      <Tooltip :text="t('style.top')">
        <button
          type="button"
          :aria-label="t('style.top')"
          :class="sideBtnClass('top')"
          @click="emit('update:modelValue', 'top')"
        >
          <span class="relative block size-4">
            <span :class="cn('absolute inset-0 border rounded-[3px]', sideGlyph.top.square, sideSquareClass('top'))" />
            <span :class="cn('absolute rounded-full', sideGlyph.top.bar, sideBarClass('top'))" />
          </span>
        </button>
      </Tooltip>
      <span />
      <Tooltip :text="t('style.left')">
        <button
          type="button"
          :aria-label="t('style.left')"
          :class="sideBtnClass('left')"
          @click="emit('update:modelValue', 'left')"
        >
          <span class="relative block size-4">
            <span :class="cn('absolute inset-0 border rounded-[3px]', sideGlyph.left.square, sideSquareClass('left'))" />
            <span :class="cn('absolute rounded-full', sideGlyph.left.bar, sideBarClass('left'))" />
          </span>
        </button>
      </Tooltip>
      <Tooltip :text="t('style.allSides')">
        <button
          type="button"
          :aria-label="t('style.allSides')"
          :class="sideBtnClass('all')"
          @click="emit('update:modelValue', 'all')"
        >
          <span :class="cn('block size-4 border-2 rounded-[3px]', isActive('all') ? 'border-uf-accent' : 'border-uf-muted')" />
        </button>
      </Tooltip>
      <Tooltip :text="t('style.right')">
        <button
          type="button"
          :aria-label="t('style.right')"
          :class="sideBtnClass('right')"
          @click="emit('update:modelValue', 'right')"
        >
          <span class="relative block size-4">
            <span :class="cn('absolute inset-0 border rounded-[3px]', sideGlyph.right.square, sideSquareClass('right'))" />
            <span :class="cn('absolute rounded-full', sideGlyph.right.bar, sideBarClass('right'))" />
          </span>
        </button>
      </Tooltip>
      <span />
      <Tooltip :text="t('style.bottom')">
        <button
          type="button"
          :aria-label="t('style.bottom')"
          :class="sideBtnClass('bottom')"
          @click="emit('update:modelValue', 'bottom')"
        >
          <span class="relative block size-4">
            <span :class="cn('absolute inset-0 border rounded-[3px]', sideGlyph.bottom.square, sideSquareClass('bottom'))" />
            <span :class="cn('absolute rounded-full', sideGlyph.bottom.bar, sideBarClass('bottom'))" />
          </span>
        </button>
      </Tooltip>
      <span />
    </div>
  </div>
</template>
