<script setup lang="ts">
import type { SegmentOption } from '@/components/ui'
import type { ClassUsageFilter } from '@/vue/composables/style/useClassLibrary'
import { Plus, Search, X } from '@lucide/vue'
import { computed } from 'vue'
import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger, SegmentControl } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useUframeI18n } from '@/vue/i18n'

const emit = defineEmits<{
  submitAdd: []
}>()

const query = defineModel<string>('query', { required: true })
const usageFilter = defineModel<ClassUsageFilter>('usageFilter', { required: true })
const addOpen = defineModel<boolean>('addOpen', { required: true })
const addName = defineModel<string>('addName', { required: true })

const { t } = useUframeI18n()
const usageOptions = computed<Array<SegmentOption<ClassUsageFilter>>>(() => [
  { value: 'all', label: t('classes.all') },
  { value: 'used', label: t('classes.used') },
  { value: 'unused', label: t('classes.unused') },
])

function onAddOpenChange(open: boolean) {
  addOpen.value = open
  if (open)
    addName.value = ''
}
</script>

<template>
  <div class="shrink-0 flex flex-col gap-2 px-3 pt-3">
    <Popover :open="addOpen" @update:open="onAddOpenChange">
      <PopoverTrigger as-child>
        <Button variant="subtle" size="sm" class="w-full" :icon="Plus">
          {{ t('classes.add') }}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-64"
        align="start"
        :title="t('classes.add')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="(event: Event) => event.preventDefault()"
      >
        <form class="flex flex-col gap-3" @submit.prevent="emit('submitAdd')">
          <Label>
            <span>{{ t('classes.className') }}</span>
            <Input v-model="addName" autofocus placeholder="new-class" />
          </Label>
          <div class="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" @click="onAddOpenChange(false)">
              {{ t('common.cancel') }}
            </Button>
            <Button type="submit" size="sm">
              {{ t('common.add') }}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>

    <div class="relative">
      <Search :size="14" :stroke-width="2" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-uf-muted" />
      <Input
        v-model="query"
        :placeholder="t('classes.search')"
        class="h-8 pl-8 pr-7"
        @keydown.escape="query = ''"
      />
      <button
        v-if="query"
        type="button"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex size-5 items-center justify-center rounded text-uf-muted cursor-pointer transition-colors hover:text-uf-text"
        :aria-label="t('classes.clearSearch')"
        @click="query = ''"
      >
        <X :size="13" :stroke-width="2" />
      </button>
    </div>

    <SegmentControl
      v-model="usageFilter"
      :options="usageOptions"
      show-labels
      :aria-label="t('classes.filterUsage')"
    />
  </div>
</template>
