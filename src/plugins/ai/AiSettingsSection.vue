<script setup lang="ts">
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Check, ChevronsUpDown, Eye, EyeOff, RefreshCw, Search } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'
import { listOpenAiModels, normalizeOpenAiBaseUrl } from './listModels'
import { useAiStorage } from './storage'
import { useAiModelPicker } from './useAiModelPicker'

const props = defineProps<{
  editor: PageEditorInstance
}>()
const { t } = useUframeI18n()

// API key / model config, namespaced under `storage.plugins.ai` (per-browser,
// never in the document/globals). Masked by default.
const ai = useAiStorage(props.editor)
const showKey = ref(false)
const aiApiKey = computed(() => ai.apiKey.value)
function setAiApiKey(value: string) {
  ai.apiKey.value = value.trim()
}

const aiApiBaseUrl = computed({
  get: () => ai.apiBaseUrl.value,
  set: (v) => { ai.apiBaseUrl.value = v.trim() },
})
const aiModel = computed({
  get: () => ai.model.value,
  set: (v) => { ai.model.value = v.trim() },
})

// Model picker options, pulled from the provider's /v1/models endpoint once a key
// is present. Browser → provider CORS may block this (esp. api.openai.com); on
// failure we surface the error and fall back to free-text entry via the datalist.
const models = ref<string[]>([])
const modelsLoading = ref(false)
const modelsError = ref<string | null>(null)

// Cache key = normalized base URL, so different providers keep separate lists.
function cacheKey(): string {
  return normalizeOpenAiBaseUrl(aiApiBaseUrl.value)
}
function cachedModels(): string[] {
  return ai.modelsCache.value?.[cacheKey()] ?? []
}

async function loadModels(force = false) {
  // Show the cached list immediately (survives reloads and a failed refetch).
  models.value = cachedModels()
  const key = aiApiKey.value
  if (!key) {
    modelsError.value = null
    return
  }
  // Don't hit the network on reopen when we already have a cached list — only on
  // an explicit refresh or when the key / base URL changes.
  if (!force && models.value.length)
    return
  modelsLoading.value = true
  modelsError.value = null
  try {
    const fetched = await listOpenAiModels(key, aiApiBaseUrl.value)
    models.value = fetched
    ai.modelsCache.value = { ...ai.modelsCache.value, [cacheKey()]: fetched }
  }
  catch (err) {
    // Keep the cached list (if any) on failure; just surface the error.
    modelsError.value = err instanceof Error ? err.message : t('ai.failedModels')
  }
  finally {
    modelsLoading.value = false
  }
}

// On open: show the cache; fetch only if there's no cached list yet.
onMounted(() => loadModels())
// The key or base URL changed → force a refresh (debounced so typing doesn't spam).
watchDebounced([aiApiKey, aiApiBaseUrl], () => loadModels(true), { debounce: 600 })

// Searchable model picker (Popover + filter) — OpenRouter & co. list hundreds.
const { modelOpen, modelQuery, filteredModels, customModelQuery, onModelOpenChange, selectModel } = useAiModelPicker(aiModel, models)
const modelOption = 'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs cursor-pointer transition-colors text-uf-text hover:bg-uf-panel-muted'

// Stacked field label, matching BreakpointForm / the style-panel fields.
const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'
</script>

<template>
  <div class="shrink-0 flex flex-col gap-2.5 px-3 pt-3 pb-3 border-b border-uf-border">
    <p class="m-0 text-[11px] leading-snug text-uf-muted">
      {{ t('ai.description') }}
    </p>
    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('ai.apiKey') }}</span>
      <div class="flex items-center h-8 rounded-md border border-input bg-transparent pl-2 pr-1 focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent">
        <input
          :type="showKey ? 'text' : 'password'"
          :value="aiApiKey"
          class="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          placeholder="sk-…"
          :aria-label="t('ai.apiKey')"
          @input="setAiApiKey(($event.target as HTMLInputElement).value)"
        >
        <button
          type="button"
          class="grid size-6 shrink-0 place-items-center rounded-sm text-uf-muted transition-colors hover:text-uf-text"
          :aria-label="showKey ? t('ai.hideKey') : t('ai.showKey')"
          @click="showKey = !showKey"
        >
          <component :is="showKey ? EyeOff : Eye" :size="14" :stroke-width="1.75" />
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('ai.apiUrl') }}</span>
      <input
        :value="aiApiBaseUrl"
        class="h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-uf-accent focus:border-uf-accent placeholder:text-muted-foreground"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        placeholder="https://api.openai.com/v1"
        :aria-label="t('ai.apiUrl')"
        @input="aiApiBaseUrl = ($event.target as HTMLInputElement).value"
      >
    </div>
    <div class="flex flex-col gap-1">
      <span :class="fieldLabel">{{ t('ai.model') }}</span>
      <div class="flex items-center gap-1.5">
        <Popover v-model:open="modelOpen" @update:open="onModelOpenChange">
          <PopoverTrigger
            class="flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2 text-xs outline-none transition-colors hover:bg-uf-panel-muted focus-visible:ring-1 focus-visible:ring-uf-accent data-[state=open]:ring-1 data-[state=open]:ring-uf-accent"
            :aria-label="t('ai.model')"
          >
            <span class="truncate" :class="!aiModel && 'text-muted-foreground'">{{ aiModel || t('ai.selectModel') }}</span>
            <ChevronsUpDown :size="13" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
          </PopoverTrigger>
          <PopoverContent align="start" class="w-(--reka-popover-trigger-width) p-0">
            <div class="flex items-center gap-1.5 border-b border-uf-border px-2">
              <Search :size="13" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
              <input
                v-model="modelQuery"
                class="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                :placeholder="t('ai.searchModels')"
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                :aria-label="t('ai.searchModels')"
              >
            </div>
            <ScrollArea class="max-h-64">
              <ul class="m-0 list-none p-1">
                <li v-if="customModelQuery">
                  <button type="button" :class="modelOption" @click="selectModel(customModelQuery)">
                    <span class="flex-1 min-w-0 truncate">{{ t('ai.useCustomModel', { model: customModelQuery }) }}</span>
                  </button>
                </li>
                <li v-for="m in filteredModels" :key="m">
                  <button type="button" :class="[modelOption, m === aiModel && 'text-uf-accent']" @click="selectModel(m)">
                    <span class="flex-1 min-w-0 truncate">{{ m }}</span>
                    <Check v-if="m === aiModel" :size="13" :stroke-width="2" class="shrink-0" />
                  </button>
                </li>
                <li
                  v-if="!filteredModels.length && !customModelQuery"
                  class="px-2 py-6 text-center text-[12px] leading-snug text-uf-muted"
                >
                  {{ modelsLoading ? t('ai.loadingModels') : (aiApiKey ? t('ai.noModels') : t('ai.enterKey')) }}
                </li>
              </ul>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <button
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-md border border-input text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text disabled:opacity-50 disabled:pointer-events-none"
          :aria-label="modelsLoading ? t('ai.loadingModels') : t('ai.refreshModels')"
          :disabled="modelsLoading || !aiApiKey"
          @click="loadModels(true)"
        >
          <RefreshCw :size="14" :stroke-width="1.75" :class="modelsLoading && 'animate-spin'" />
        </button>
      </div>
      <span v-if="modelsError" class="text-[11px] leading-snug text-uf-danger">{{ modelsError }}</span>
      <span v-else-if="modelsLoading" class="text-[11px] text-uf-muted">{{ t('ai.loadingModels') }}</span>
      <span v-else-if="models.length" class="text-[11px] text-uf-muted">{{ t('ai.modelsCount', { count: models.length }) }}</span>
      <span v-else-if="aiApiKey" class="text-[11px] text-uf-muted">{{ t('ai.customModelHint') }}</span>
      <span v-else class="text-[11px] text-uf-muted">{{ t('ai.enterKey') }}</span>
    </div>
  </div>
</template>
