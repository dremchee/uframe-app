<script setup lang="ts">
import type { HtmlAttributes } from '@/core'
import type { AttributeDraft } from '@/vue/components/AttributeForm.vue'
import { Info, Plus } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from '@/components/ui'
import { normalizeHtmlAttributes } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import AttributeForm from '@/vue/components/AttributeForm.vue'
import AttributeRow from '@/vue/components/AttributeRow.vue'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<HtmlAttributes>({ required: true })
const { t } = useUframeI18n()
const addOpen = shallowRef(false)

const entries = computed(() => Object.entries(normalizeHtmlAttributes(model.value)))
const attributeNames = computed(() => entries.value.map(([name]) => name))

function addAttribute(draft: AttributeDraft) {
  model.value = {
    ...normalizeHtmlAttributes(model.value),
    [draft.name]: draft.value,
  }
  addOpen.value = false
}

function updateAttribute(currentName: string, draft: AttributeDraft) {
  const next: HtmlAttributes = {}
  for (const [name, value] of entries.value)
    next[name === currentName ? draft.name : name] = name === currentName ? draft.value : value
  model.value = next
}

function removeAttribute(name: string) {
  model.value = Object.fromEntries(entries.value.filter(([current]) => current !== name))
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <div class="flex items-center">
      <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">
        {{ t('attributes.title') }}
      </span>
      <Tooltip :text="t('attributes.hint')">
        <span class="ml-1 inline-flex shrink-0 cursor-help text-uf-muted" tabindex="0">
          <Info :size="12" :stroke-width="2" :aria-label="t('attributes.moreInfo')" />
        </span>
      </Tooltip>
    </div>

    <div v-if="entries.length" class="flex flex-col gap-1">
      <AttributeRow
        v-for="[name, value] in entries"
        :key="name"
        :name="name"
        :value="value"
        :existing-names="attributeNames.filter(existing => existing !== name)"
        @update="updateAttribute(name, $event)"
        @remove="removeAttribute(name)"
      />
    </div>

    <Popover :open="addOpen" @update:open="addOpen = $event">
      <PopoverTrigger as-child>
        <Button variant="subtle" size="sm" class="w-full" :icon="Plus">
          {{ t('attributes.add') }}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-64"
        align="end"
        :title="t('attributes.add')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="(event: Event) => event.preventDefault()"
      >
        <AttributeForm
          v-if="addOpen"
          :existing-names="attributeNames"
          :submit-label="t('common.add')"
          @submit="addAttribute"
          @cancel="addOpen = false"
        />
      </PopoverContent>
    </Popover>
  </section>
</template>
