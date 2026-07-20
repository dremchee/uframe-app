<script setup lang="ts">
import type { ImageBlockProps } from '@/core'
import { ImagePlus, RefreshCw, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Button, Input, Label, Tooltip } from '@/components/ui'
import { assetKey } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<ImageBlockProps>({ required: true })

const { editor, dataContext, requestAsset } = useEditorContext()
const { t } = useUframeI18n()

const block = computed(() => editor.selectedBlock.value)
const asset = computed(() => block.value?.asset)

// Thumbnail for the chosen asset: the just-picked preview, else the host's
// resolver (survives reload), else the authored URL.
const previewUrl = computed(() => {
  const a = asset.value
  if (!a)
    return ''
  const key = assetKey(a)
  return editor.assetPreviews.value[key]
    ?? dataContext.value?.assets?.[key]
    ?? dataContext.value?.resolveAsset?.(a)
    ?? model.value.src
    ?? ''
})

const picking = ref(false)

async function pick() {
  const id = block.value?.id
  if (!id || !requestAsset || picking.value)
    return
  picking.value = true
  try {
    const result = await requestAsset({ blockId: id, kind: 'image' })
    if (result)
      editor.applyAsset(id, result)
  }
  finally {
    picking.value = false
  }
}

function clear() {
  if (block.value)
    editor.setBlockAsset(block.value.id, null)
}
</script>

<template>
  <div class="grid gap-2">
    <!-- Media library asset (only when the host wired a picker). -->
    <div v-if="requestAsset" class="grid gap-1.5">
      <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">{{ t('blocks.image.media') }}</span>

      <div v-if="asset" class="flex items-center gap-2 rounded-md border border-uf-border bg-uf-panel-muted/50 p-1.5">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt=""
          class="size-10 shrink-0 rounded object-cover border border-uf-border"
        >
        <div class="min-w-0 flex-1">
          <div class="truncate text-[12px] text-uf-text">
            {{ asset.id }}
          </div>
          <div class="text-[11px] text-uf-muted">
            {{ asset.source }}
          </div>
        </div>
        <Tooltip :text="t('blocks.image.replace')">
          <button
            type="button"
            :aria-label="t('blocks.image.replace')"
            class="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-input text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
            :disabled="picking"
            @click="pick"
          >
            <RefreshCw :size="14" :stroke-width="2" />
          </button>
        </Tooltip>
        <Tooltip :text="t('blocks.image.remove')">
          <button
            type="button"
            :aria-label="t('blocks.image.remove')"
            class="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-input text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
            @click="clear"
          >
            <X :size="14" :stroke-width="2" />
          </button>
        </Tooltip>
      </div>

      <Button v-else variant="outline" size="sm" class="justify-start gap-2" :disabled="picking" @click="pick">
        <ImagePlus :size="14" :stroke-width="2" />
        {{ t('blocks.image.chooseMedia') }}
      </Button>
    </div>

    <Label>
      <span>{{ t('blocks.image.url') }}</span>
      <Input v-model="model.src" type="url" />
    </Label>
    <Label>
      <span>{{ t('blocks.image.altText') }}</span>
      <Input v-model="model.alt" type="text" />
    </Label>
    <Label>
      <span>{{ t('blocks.image.caption') }}</span>
      <Input v-model="model.caption" type="text" />
    </Label>
  </div>
</template>
