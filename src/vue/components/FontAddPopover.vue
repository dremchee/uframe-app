<script setup lang="ts">
import type { FontProviderId, FontStyle } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Plus, Search } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { fontFamilyStack } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { cn } from '@/lib/utils'
import { lastFontProvider } from '@/vue/composables/fonts/useFontProviderMemory'
import { useLocalFonts } from '@/vue/composables/fonts/useLocalFonts'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
}>()

const { t } = useUframeI18n()
const local = useLocalFonts()
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]
const STYLES: FontStyle[] = ['normal', 'italic']
const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese']
const STYLE_LABEL = computed<Record<FontStyle, string>>(() => ({
  normal: t('fonts.styleNormal'),
  italic: t('fonts.styleItalic'),
}))
const providerOptions = computed<Array<{ value: FontProviderId, label: string }>>(() => [
  ...(local.supported ? [{ value: 'local' as const, label: t('fonts.providerLocal') }] : []),
  { value: 'google', label: t('fonts.providerGoogle') },
  { value: 'bunny', label: t('fonts.providerBunny') },
  { value: 'custom', label: t('fonts.providerCustom') },
])

const addOpen = ref(false)
const draft = ref<{
  provider: FontProviderId
  family: string
  weights: number[]
  styles: FontStyle[]
  subsets: string[]
  url: string
}>({ provider: 'google', family: '', weights: [400], styles: ['normal'], subsets: ['latin'], url: '' })
const installedQuery = ref('')
const registered = computed(() => new Set(props.editor.fonts.value.map(font => font.family)))
const installedResults = computed(() => {
  const query = installedQuery.value.trim().toLowerCase()
  return local.families.value.filter(family => !query || family.toLowerCase().includes(query)).slice(0, 200)
})
const canSubmit = computed(() => {
  const current = draft.value
  if (current.provider === 'local')
    return false
  if (!current.family.trim())
    return false
  return current.provider !== 'custom' || !!current.url.trim()
})
const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'
const rootEl = ref<HTMLElement | null>(null)
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(rootEl)

function onAddOpenChange(open: boolean) {
  addOpen.value = open
  if (open) {
    installedQuery.value = ''
    draft.value = { provider: lastFontProvider.value, family: '', weights: [400], styles: ['normal'], subsets: ['latin'], url: '' }
  }
}

watch(() => draft.value.provider, (provider) => {
  lastFontProvider.value = provider
  if (provider === 'local' && local.supported && !local.families.value.length)
    void local.load()
})

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function submitAdd() {
  const current = draft.value
  if (!canSubmit.value)
    return
  const added = props.editor.addFont(current.provider === 'custom'
    ? { family: current.family, provider: 'custom', url: current.url }
    : {
        family: current.family,
        provider: current.provider,
        weights: current.weights.length ? current.weights : undefined,
        styles: current.styles.length ? current.styles : undefined,
        subsets: current.subsets.length ? current.subsets : undefined,
      })
  if (added)
    addOpen.value = false
}

function addLocal(family: string) {
  if (props.editor.addFont({ family, provider: 'local' }))
    addOpen.value = false
}

function chipClass(active: boolean): string {
  return cn(
    'inline-flex h-6 items-center justify-center rounded border px-2 text-[11px] tabular-nums transition-colors cursor-pointer',
    active ? 'border-uf-accent bg-uf-accent/10 text-uf-accent' : 'border-uf-border text-uf-muted hover:bg-uf-panel-muted',
  )
}
</script>

<template>
  <div ref="rootEl">
    <Popover :open="addOpen" @update:open="onAddOpenChange">
      <PopoverTrigger as-child>
        <Button variant="subtle" size="sm" class="w-full" :icon="Plus">
          {{ t('fonts.add') }}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-72"
        :side="popoverSide"
        align="start"
        :reference="popoverReference"
        :title="t('fonts.addTitle')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="preventOverlayDismiss"
      >
        <div class="flex flex-col gap-3">
          <Label>
            <span>{{ t('fonts.provider') }}</span>
            <Select v-model="draft.provider">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in providerOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Label>

          <template v-if="draft.provider === 'local'">
            <div class="relative">
              <Search :size="14" :stroke-width="2" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-uf-muted" />
              <Input v-model="installedQuery" class="pl-8" :placeholder="t('fonts.searchInstalled')" />
            </div>
            <p v-if="local.loading.value" class="m-0 py-3 text-center text-[11px] text-uf-muted">
              {{ t('fonts.readingInstalled') }}
            </p>
            <p v-else-if="local.error.value" class="m-0 py-3 text-center text-[11px] text-uf-danger">
              {{ local.error.value }}
            </p>
            <ScrollArea v-else class="-mx-1 max-h-52">
              <div class="px-1">
                <button
                  v-for="family in installedResults"
                  :key="family"
                  type="button"
                  class="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm text-uf-text hover:bg-uf-panel-muted disabled:opacity-40"
                  :disabled="registered.has(family)"
                  @click="addLocal(family)"
                >
                  <span class="truncate" :style="{ fontFamily: fontFamilyStack(family) }">{{ family }}</span>
                  <span v-if="registered.has(family)" class="shrink-0 text-[10px] text-uf-muted">{{ t('fonts.added') }}</span>
                </button>
                <p v-if="!installedResults.length" class="m-0 px-2 py-3 text-center text-[11px] text-uf-muted">
                  {{ t('fonts.noMatches') }}
                </p>
              </div>
            </ScrollArea>
          </template>

          <template v-else>
            <Label>
              <span>{{ t('fonts.family') }}</span>
              <Input v-model="draft.family" autofocus :placeholder="t('fonts.familyPlaceholder')" />
            </Label>
            <Label v-if="draft.provider === 'custom'">
              <span>{{ t('fonts.stylesheetUrl') }}</span>
              <Input v-model="draft.url" :placeholder="t('fonts.urlPlaceholder')" />
            </Label>
            <template v-else>
              <div class="flex flex-col gap-1.5">
                <span :class="fieldLabel">{{ t('fonts.weights') }}</span>
                <div class="flex flex-wrap gap-1">
                  <button v-for="weight in WEIGHTS" :key="weight" type="button" :class="chipClass(draft.weights.includes(weight))" :aria-pressed="draft.weights.includes(weight)" @click="draft.weights = toggle(draft.weights, weight)">
                    {{ weight }}
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <span :class="fieldLabel">{{ t('fonts.styles') }}</span>
                <div class="flex flex-wrap gap-1">
                  <button v-for="style in STYLES" :key="style" type="button" :class="chipClass(draft.styles.includes(style))" :aria-pressed="draft.styles.includes(style)" @click="draft.styles = toggle(draft.styles, style)">
                    {{ STYLE_LABEL[style] }}
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <span :class="fieldLabel">{{ t('fonts.subsets') }}</span>
                <div class="flex flex-wrap gap-1">
                  <button v-for="subset in SUBSETS" :key="subset" type="button" :class="chipClass(draft.subsets.includes(subset))" :aria-pressed="draft.subsets.includes(subset)" @click="draft.subsets = toggle(draft.subsets, subset)">
                    {{ subset }}
                  </button>
                </div>
              </div>
            </template>
            <div class="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" @click="onAddOpenChange(false)">
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" size="sm" :disabled="!canSubmit" @click="submitAdd">
                {{ t('common.add') }}
              </Button>
            </div>
          </template>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
