<script setup lang="ts">
import { Check, Code2, Copy } from '@lucide/vue'
import { onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue'
import { Popover, PopoverContent, PopoverTrigger, Tooltip } from '@/components/ui'
import CssPreviewPanel from '@/vue/components/properties/CssPreviewPanel.vue'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const { t } = useUframeI18n()
const triggerEl = ref<HTMLElement | null>(null)
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(triggerEl)
const previewPanel = useTemplateRef<InstanceType<typeof CssPreviewPanel>>('previewPanel')
const copied = shallowRef(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyCss() {
  if (!await previewPanel.value?.copyCss())
    return

  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1200)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <Popover>
    <Tooltip :text="t('cssPreview.open')">
      <span class="inline-flex">
        <PopoverTrigger as-child>
          <button
            ref="triggerEl"
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text data-[state=open]:bg-uf-panel-muted data-[state=open]:text-uf-text"
            :aria-label="t('cssPreview.open')"
          >
            <Code2 :size="15" :stroke-width="1.75" />
          </button>
        </PopoverTrigger>
      </span>
    </Tooltip>
    <PopoverContent
      :side="popoverSide"
      :reference="popoverReference"
      align="start"
      class="h-[min(22rem,calc(100vh-2rem))] w-[28rem] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex size-5 items-center justify-center rounded text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-uf-accent"
          :aria-label="copied ? t('cssPreview.copied') : t('cssPreview.copy')"
          @click="copyCss"
        >
          <Check v-if="copied" :size="13" class="text-emerald-500" />
          <Copy v-else :size="13" :stroke-width="1.75" />
        </button>
      </template>
      <CssPreviewPanel ref="previewPanel" embedded />
    </PopoverContent>
  </Popover>
</template>
