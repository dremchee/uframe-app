<script setup lang="ts">
import type { FontDef, FontProviderId, FontStyle } from '@/core'
import { Pencil } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Button, IconButton, Input, Label, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { cn } from '@/lib/utils'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  font: FontDef
}>()

const emit = defineEmits<{
  update: [font: FontDef]
}>()

const { t } = useUframeI18n()
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]
const STYLES: FontStyle[] = ['normal', 'italic']
const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese']
const providers: Array<{ value: Exclude<FontProviderId, 'local'>, label: string }> = [
  { value: 'google', label: t('fonts.providerGoogle') },
  { value: 'bunny', label: t('fonts.providerBunny') },
  { value: 'custom', label: t('fonts.providerCustom') },
]
const styleLabel = computed<Record<FontStyle, string>>(() => ({
  normal: t('fonts.styleNormal'),
  italic: t('fonts.styleItalic'),
}))
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(rootEl)
const draft = ref<FontDef>(createDraft(props.font))
const canSubmit = computed(() => draft.value.family.trim() && (draft.value.provider !== 'custom' || draft.value.url?.trim()))
const fieldLabel = 'text-uf-muted text-[11px] font-semibold uppercase tracking-wider'

function createDraft(font: FontDef): FontDef {
  return {
    family: font.family,
    provider: font.provider,
    weights: font.weights?.length ? [...font.weights] : [400],
    styles: font.styles?.length ? [...font.styles] : ['normal'],
    subsets: font.subsets?.length ? [...font.subsets] : ['latin'],
    url: font.url ?? '',
  }
}

function onOpenChange(nextOpen: boolean) {
  open.value = nextOpen
  if (nextOpen)
    draft.value = createDraft(props.font)
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

function chipClass(active: boolean): string {
  return cn(
    'inline-flex h-6 items-center justify-center rounded border px-2 text-[11px] tabular-nums transition-colors cursor-pointer',
    active ? 'border-uf-accent bg-uf-accent/10 text-uf-accent' : 'border-uf-border text-uf-muted hover:bg-uf-panel-muted',
  )
}

function save() {
  if (!canSubmit.value)
    return
  const font = draft.value
  emit('update', {
    family: font.family.trim(),
    provider: font.provider,
    ...(font.provider === 'local'
      ? {}
      : {
          ...(font.weights?.length ? { weights: font.weights } : {}),
          ...(font.styles?.length ? { styles: font.styles } : {}),
          ...(font.subsets?.length ? { subsets: font.subsets } : {}),
        }),
    ...(font.provider === 'custom' && font.url?.trim() ? { url: font.url.trim() } : {}),
  })
  open.value = false
}
</script>

<template>
  <div ref="rootEl">
    <Popover :open="open" @update:open="onOpenChange">
      <PopoverTrigger as-child>
        <IconButton size="sm" :aria-label="t('common.edit')">
          <Pencil :size="13" :stroke-width="1.75" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        class="w-72"
        :side="popoverSide"
        align="start"
        :reference="popoverReference"
        :title="t('common.edit')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="preventOverlayDismiss"
      >
        <div class="flex flex-col gap-3">
          <Label>
            <span>{{ t('fonts.provider') }}</span>
            <Select v-model="draft.provider" :disabled="draft.provider === 'local'">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="provider in providers" :key="provider.value" :value="provider.value">
                  {{ provider.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label>
            <span>{{ t('fonts.family') }}</span>
            <Input v-model="draft.family" :disabled="draft.provider === 'local'" :placeholder="t('fonts.familyPlaceholder')" />
          </Label>
          <Label v-if="draft.provider === 'custom'">
            <span>{{ t('fonts.stylesheetUrl') }}</span>
            <Input v-model="draft.url" :placeholder="t('fonts.urlPlaceholder')" />
          </Label>
          <template v-else-if="draft.provider !== 'local'">
            <div class="flex flex-col gap-1.5">
              <span :class="fieldLabel">{{ t('fonts.weights') }}</span>
              <div class="flex flex-wrap gap-1">
                <button v-for="weight in WEIGHTS" :key="weight" type="button" :class="chipClass(draft.weights?.includes(weight) ?? false)" :aria-pressed="draft.weights?.includes(weight) ?? false" @click="draft.weights = toggle(draft.weights ?? [], weight)">
                  {{ weight }}
                </button>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <span :class="fieldLabel">{{ t('fonts.styles') }}</span>
              <div class="flex flex-wrap gap-1">
                <button v-for="style in STYLES" :key="style" type="button" :class="chipClass(draft.styles?.includes(style) ?? false)" :aria-pressed="draft.styles?.includes(style) ?? false" @click="draft.styles = toggle(draft.styles ?? [], style)">
                  {{ styleLabel[style] }}
                </button>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <span :class="fieldLabel">{{ t('fonts.subsets') }}</span>
              <div class="flex flex-wrap gap-1">
                <button v-for="subset in SUBSETS" :key="subset" type="button" :class="chipClass(draft.subsets?.includes(subset) ?? false)" :aria-pressed="draft.subsets?.includes(subset) ?? false" @click="draft.subsets = toggle(draft.subsets ?? [], subset)">
                  {{ subset }}
                </button>
              </div>
            </div>
          </template>
          <div class="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" @click="onOpenChange(false)">
              {{ t('common.cancel') }}
            </Button>
            <Button type="button" size="sm" :disabled="!canSubmit" @click="save">
              {{ t('common.save') }}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
