<script setup lang="ts">
import type { AttributeDraft } from '@/vue/components/AttributeForm.vue'
import { Braces, Pencil, Trash2 } from '@lucide/vue'
import { shallowRef } from 'vue'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  Tooltip,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import AttributeForm from '@/vue/components/AttributeForm.vue'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{
  name: string
  value: string
  existingNames: string[]
}>()

const emit = defineEmits<{
  update: [draft: AttributeDraft]
  remove: []
}>()

const { t } = useUframeI18n()
const editOpen = shallowRef(false)

function submitEdit(draft: AttributeDraft) {
  emit('update', draft)
  editOpen.value = false
}
</script>

<template>
  <div class="group flex items-center gap-1.5 h-9 pl-2 pr-1 rounded-md border border-uf-border bg-uf-panel">
    <Braces :size="13" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
    <span class="min-w-0 flex-1 truncate text-[12px] text-uf-text" :title="name">
      {{ name }}
    </span>
    <span class="max-w-[35%] shrink-0 truncate text-[11px] text-uf-muted" :title="value">
      {{ value || '—' }}
    </span>

    <Popover :open="editOpen" @update:open="editOpen = $event">
      <div class="relative">
        <PopoverAnchor class="pointer-events-none absolute inset-0" />
        <Tooltip :text="t('attributes.edit')">
          <button
            type="button"
            class="inline-flex items-center justify-center h-6 w-6 rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
            :aria-label="t('attributes.edit')"
            @click="editOpen = true"
          >
            <Pencil :size="13" :stroke-width="1.75" />
          </button>
        </Tooltip>
      </div>
      <PopoverContent
        class="w-64"
        align="end"
        :title="t('attributes.edit')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="(event: Event) => event.preventDefault()"
      >
        <AttributeForm
          v-if="editOpen"
          :initial-name="name"
          :initial-value="value"
          :existing-names="existingNames"
          :submit-label="t('common.save')"
          @submit="submitEdit"
          @cancel="editOpen = false"
        />
      </PopoverContent>
    </Popover>

    <Tooltip :text="t('attributes.remove', { name })">
      <button
        type="button"
        class="inline-flex items-center justify-center h-6 w-6 rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-danger"
        :aria-label="t('attributes.remove', { name })"
        @click="emit('remove')"
      >
        <Trash2 :size="13" :stroke-width="1.75" />
      </button>
    </Tooltip>
  </div>
</template>
