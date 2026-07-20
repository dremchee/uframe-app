<script setup lang="ts">
import { ArrowUp, Check, ChevronDown, Frame, Loader2, Plus, Search, Sparkles, Wand2, WandSparkles, X } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import { AI_PRESETS, presetLabel } from './presets'
import { useAiChat } from './useAiChat'
import { useAiFloatingWindow } from './useAiFloatingWindow'
import { useAiModelPicker } from './useAiModelPicker'

const { open, messages, loading, scope, suggestions, ready, model, models, preset, send, clear } = useAiChat()
const { t } = useUframeI18n()

// Canvas geometry for anchoring/clamping within the canvas pane, published by
// the canvas on the editor context.
const { canvas } = useEditorContext()

const input = ref('')
const windowRef = ref<HTMLElement>()
const listRef = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

// Grow the textarea with its content, up to a cap (then it scrolls).
function autosize() {
  const el = textareaRef.value
  if (!el)
    return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}
watch(input, () => nextTick(autosize))

const { windowStyle, onHeaderPointerDown, onResizePointerDown } = useAiFloatingWindow({ open, canvas, windowRef })

// ── Send ────────────────────────────────────────────────────────────────────
function submit() {
  const text = input.value.trim()
  if (!text || loading.value || !ready.value)
    return
  void send(text)
  input.value = ''
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}

watch(() => messages.value.length, async () => {
  await nextTick()
  const el = listRef.value
  if (el)
    el.scrollTop = el.scrollHeight
})

// ── Model picker (composer pill) ────────────────────────────────────────────
const { modelOpen, modelQuery, filteredModels, onModelOpenChange, selectModel } = useAiModelPicker(model, models)
const modelOption = 'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs cursor-pointer transition-colors text-uf-text hover:bg-uf-panel-muted'

// ── Role/style preset (below-composer chip) ────────────────────────────────
const presetOpen = ref(false)
const presets = AI_PRESETS
const currentPresetLabel = computed(() => t(`ai.preset.${preset.value}`) === `ai.preset.${preset.value}` ? presetLabel(preset.value) : t(`ai.preset.${preset.value}`))
const suggestionKeys: Record<string, string> = {
  'Build a SaaS landing page': 'ai.suggestion.saas',
  'Create an About page': 'ai.suggestion.about',
  'Add a pricing section': 'ai.suggestion.pricing',
  'Make a contact page': 'ai.suggestion.contact',
  'Turn this into a 3-column feature grid': 'ai.suggestion.features',
  'Add a CTA with a heading and button': 'ai.suggestion.cta',
  'Improve spacing and hierarchy': 'ai.suggestion.spacing',
  'Rewrite the copy to be punchier': 'ai.suggestion.rewrite',
  'Make this bigger and bolder': 'ai.suggestion.bigger',
  'Match the colors to the brand': 'ai.suggestion.brand',
  'Shorten the text': 'ai.suggestion.shorten',
}
function suggestionLabel(value: string): string {
  const key = suggestionKeys[value]
  return key ? t(key) : value
}
function selectPreset(id: string) {
  preset.value = id
  presetOpen.value = false
}
</script>

<template>
  <div
    v-if="open"
    ref="windowRef"
    class="uf-overlay fixed z-50 flex max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-lg border border-uf-border bg-uf-panel text-uf-text shadow-pb"
    :style="windowStyle"
    role="dialog"
    :aria-label="t('ai.assistant')"
  >
    <!-- Header / drag handle -->
    <header
      class="flex shrink-0 cursor-grab items-center gap-2 border-b border-uf-border px-3 py-2 active:cursor-grabbing select-none"
      @pointerdown="onHeaderPointerDown"
    >
      <WandSparkles :size="15" :stroke-width="1.75" class="shrink-0 text-uf-accent" />
      <span class="text-sm font-bold">AI</span>
      <span class="flex-1" />
      <button
        type="button"
        class="grid size-6 shrink-0 place-items-center rounded-sm text-uf-muted transition-colors hover:text-uf-text"
        :aria-label="t('ai.close')"
        @click="open = false"
      >
        <X :size="15" :stroke-width="1.75" />
      </button>
    </header>

    <!-- Messages -->
    <div ref="listRef" class="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto p-3">
      <template v-if="!messages.length">
        <p class="m-0 px-1 pt-3 pb-1 text-center text-[12px] leading-relaxed text-uf-muted">
          {{ t('ai.emptyHint') }}
        </p>
        <div v-if="ready" class="flex flex-col gap-1.5 px-1 pt-1">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="flex items-center gap-2 rounded-lg border border-uf-border px-3 py-2 text-left text-[12px] text-uf-text transition-colors hover:bg-uf-panel-muted"
            @click="send(s)"
          >
            <Sparkles :size="12" :stroke-width="1.75" class="shrink-0 text-uf-accent" />
            <span class="min-w-0 truncate">{{ suggestionLabel(s) }}</span>
          </button>
        </div>
      </template>
      <div
        v-for="m in messages"
        :key="m.id"
        :class="cn(
          'max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-lg px-3 py-1.5 text-[13px] leading-snug',
          m.role === 'user'
            ? 'self-end bg-uf-accent text-white'
            : m.error
              ? 'self-start bg-uf-danger/10 text-uf-danger'
              : 'self-start bg-uf-panel-muted text-uf-text',
        )"
      >
        {{ m.text }}
      </div>
      <div v-if="loading" class="self-start inline-flex items-center gap-2 rounded-lg bg-uf-panel-muted px-3 py-1.5 text-[13px] text-uf-muted">
        <Loader2 :size="14" class="animate-spin" />
        {{ t('ai.generating') }}
      </div>
    </div>

    <!-- Composer -->
    <div class="shrink-0 p-2.5">
      <div class="rounded-lg border border-uf-border bg-uf-bg transition-colors focus-within:border-uf-accent focus-within:ring-1 focus-within:ring-uf-accent">
        <textarea
          ref="textareaRef"
          v-model="input"
          rows="1"
          :disabled="!ready || loading"
          class="block max-h-40 min-h-6 w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
          :placeholder="ready ? t('ai.askAnything') : t('ai.configure')"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          @keydown="onKeydown"
        />
        <!-- Toolbar: new-chat + model on the left, send on the right. -->
        <div class="flex items-center gap-1.5 p-1.5">
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-full border border-uf-border text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text disabled:opacity-40 disabled:pointer-events-none"
            :aria-label="t('ai.newChat')"
            :disabled="!messages.length || loading"
            @click="clear"
          >
            <Plus :size="15" :stroke-width="2" />
          </button>

          <Popover v-model:open="modelOpen" @update:open="onModelOpenChange">
            <PopoverTrigger
              class="inline-flex h-7 min-w-0 items-center gap-1.5 rounded-full border border-uf-border px-2.5 text-[12px] text-uf-text outline-none transition-colors hover:bg-uf-panel-muted data-[state=open]:bg-uf-panel-muted"
              :aria-label="t('ai.model')"
            >
              <Sparkles :size="12" :stroke-width="1.75" class="shrink-0 text-uf-accent" />
              <span class="max-w-35 truncate" :class="!model && 'text-uf-muted'">{{ model || t('ai.model') }}</span>
              <ChevronDown :size="12" :stroke-width="2" class="shrink-0 text-uf-muted" />
            </PopoverTrigger>
            <PopoverContent align="start" class="w-64 p-0">
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
              <div class="max-h-60 overflow-y-auto p-1">
                <button
                  v-for="m in filteredModels"
                  :key="m"
                  type="button"
                  :class="[modelOption, m === model && 'text-uf-accent']"
                  @click="selectModel(m)"
                >
                  <span class="flex-1 min-w-0 truncate">{{ m }}</span>
                  <Check v-if="m === model" :size="13" :stroke-width="2" class="shrink-0" />
                </button>
                <p v-if="!filteredModels.length" class="px-2 py-6 text-center text-[12px] leading-snug text-uf-muted">
                  {{ models.length ? t('ai.noMatch') : t('ai.loadModelsInSettings') }}
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <span class="flex-1" />

          <Button
            type="button"
            size="icon"
            class="size-8 shrink-0 rounded-full"
            :aria-label="t('ai.send')"
            :disabled="!input.trim() || loading || !ready"
            @click="submit"
          >
            <Loader2 v-if="loading" class="animate-spin" />
            <ArrowUp v-else :stroke-width="2.25" />
          </Button>
        </div>
      </div>

      <!-- Context chips below the composer: scope (follows canvas selection) + preset. -->
      <div class="mt-1.5 flex items-center gap-3 px-1">
        <span class="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-uf-muted">
          <Frame :size="12" :stroke-width="1.75" class="shrink-0" />
          <span class="truncate">{{ scope.label }}</span>
        </span>
        <Popover v-model:open="presetOpen">
          <PopoverTrigger
            class="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] text-uf-muted outline-none transition-colors hover:text-uf-text data-[state=open]:text-uf-text"
            :aria-label="t('ai.stylePreset')"
          >
            <Wand2 :size="12" :stroke-width="1.75" class="shrink-0" />
            <span>{{ currentPresetLabel }}</span>
            <ChevronDown :size="11" :stroke-width="2" class="shrink-0" />
          </PopoverTrigger>
          <PopoverContent align="start" class="w-44 p-1">
            <button
              v-for="p in presets"
              :key="p.id"
              type="button"
              :class="[modelOption, p.id === preset && 'text-uf-accent']"
              @click="selectPreset(p.id)"
            >
              <span class="flex-1 min-w-0 truncate">{{ t(`ai.preset.${p.id}`) }}</span>
              <Check v-if="p.id === preset" :size="13" :stroke-width="2" class="shrink-0" />
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- Resize grip (bottom-right) -->
    <div
      class="absolute bottom-0 right-0 z-10 grid size-4 cursor-se-resize place-items-center text-uf-muted/60 hover:text-uf-muted"
      aria-hidden="true"
      @pointerdown="onResizePointerDown"
    >
      <svg viewBox="0 0 10 10" class="size-2.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round">
        <path d="M9 3 L3 9 M9 6.5 L6.5 9" />
      </svg>
    </div>
  </div>
</template>
