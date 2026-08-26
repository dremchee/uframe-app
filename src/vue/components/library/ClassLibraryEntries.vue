<script setup lang="ts">
import { Braces, Pencil, Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import { Button, Input, Label, Popover, PopoverAnchor, PopoverContent, Tooltip } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useUframeI18n } from '@/vue/i18n'

interface ClassCombo {
  key: string
  parts: string[]
}

const props = defineProps<{
  singles: string[]
  combos: ClassCombo[]
  usageOf: (key: string) => number
  editStyles: (key: string) => void
  renameClass: (from: string, to: string) => boolean
  deleteClass: (key: string) => void
}>()

const { t } = useUframeI18n()
const renameKey = ref<string | null>(null)
const renameValue = ref('')
const deleteKey = ref<string | null>(null)

function openRename(key: string) {
  renameKey.value = key
  renameValue.value = key
}

function submitRename() {
  const from = renameKey.value
  if (!from)
    return
  if (props.renameClass(from, renameValue.value))
    renameKey.value = null
}

function confirmDelete() {
  if (deleteKey.value)
    props.deleteClass(deleteKey.value)
  deleteKey.value = null
}
</script>

<template>
  <template v-if="singles.length">
    <div class="flex flex-col gap-1">
      <div
        v-for="name in singles"
        :key="name"
        class="group flex items-center gap-1.5 h-9 pl-2 pr-1 rounded-md border border-uf-border bg-uf-panel"
      >
        <Tooltip :text="t('classes.editStyles')">
          <button
            type="button"
            class="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer"
            @click="editStyles(name)"
          >
            <Braces :size="13" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
            <span class="truncate text-[12px] text-uf-text">{{ name }}</span>
          </button>
        </Tooltip>
        <span class="shrink-0 text-[11px] text-uf-muted tabular-nums">{{ usageOf(name) }}</span>

        <Popover :open="renameKey === name" @update:open="(open: boolean) => (open ? openRename(name) : (renameKey = null))">
          <div class="relative">
            <PopoverAnchor class="pointer-events-none absolute inset-0" />
            <Tooltip :text="t('classes.rename')">
              <button
                type="button"
                class="inline-flex items-center justify-center h-6 w-6 rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
                :aria-label="t('classes.rename')"
                @click="openRename(name)"
              >
                <Pencil :size="13" :stroke-width="1.75" />
              </button>
            </Tooltip>
          </div>
          <PopoverContent
            class="w-60"
            align="end"
            :title="t('classes.rename')"
            @interact-outside="preventOverlayDismiss"
            @focus-outside="(event: Event) => event.preventDefault()"
          >
            <form class="flex flex-col gap-3" @submit.prevent="submitRename">
              <Label>
                <span>{{ t('classes.newName') }}</span>
                <Input v-model="renameValue" autofocus placeholder="class-name" />
              </Label>
              <p class="m-0 text-[11px] text-uf-muted leading-snug">
                {{ t('classes.renameHint') }}
              </p>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" @click="renameKey = null">
                  {{ t('common.cancel') }}
                </Button>
                <Button type="submit" size="sm">
                  {{ t('common.edit') }}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        <Popover :open="deleteKey === name" @update:open="(open: boolean) => (deleteKey = open ? name : null)">
          <div class="relative">
            <PopoverAnchor class="pointer-events-none absolute inset-0" />
            <Tooltip :text="t('classes.delete')">
              <button
                type="button"
                class="inline-flex items-center justify-center h-6 w-6 rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-danger"
                :aria-label="t('classes.delete')"
                @click="deleteKey = name"
              >
                <Trash2 :size="13" :stroke-width="1.75" />
              </button>
            </Tooltip>
          </div>
          <PopoverContent
            class="w-64"
            align="end"
            :title="t('classes.delete')"
            @interact-outside="preventOverlayDismiss"
            @focus-outside="(event: Event) => event.preventDefault()"
          >
            <div class="flex flex-col gap-3">
              <p class="m-0 text-xs text-uf-text leading-snug">
                {{ t('classes.deleteClassHint', { name, count: usageOf(name) }) }}
              </p>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" @click="deleteKey = null">
                  {{ t('common.cancel') }}
                </Button>
                <Button type="button" variant="destructive" size="sm" @click="confirmDelete">
                  {{ t('common.remove') }}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </template>

  <div v-if="combos.length" class="flex flex-col gap-1">
    <div
      class="mb-1 px-1 text-[11px] uppercase tracking-wider font-semibold text-uf-muted"
      :class="singles.length ? 'mt-3' : ''"
    >
      {{ t('classes.combos') }}
    </div>
    <div
      v-for="combo in combos"
      :key="combo.key"
      class="group flex items-center gap-1.5 h-9 pl-2 pr-1 rounded-md border border-uf-border bg-uf-panel"
    >
      <Tooltip :text="t('classes.editComboStyles')">
        <button type="button" class="flex-1 min-w-0 flex items-center text-left cursor-pointer" @click="editStyles(combo.key)">
          <span class="truncate text-[12px] text-uf-text">{{ combo.parts.join(' + ') }}</span>
        </button>
      </Tooltip>
      <span class="shrink-0 text-[11px] text-uf-muted tabular-nums">{{ usageOf(combo.key) }}</span>

      <Popover :open="deleteKey === combo.key" @update:open="(open: boolean) => (deleteKey = open ? combo.key : null)">
        <div class="relative">
          <PopoverAnchor class="pointer-events-none absolute inset-0" />
          <Tooltip :text="t('classes.deleteCombo')">
            <button
              type="button"
              class="inline-flex items-center justify-center h-6 w-6 rounded text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-danger"
              :aria-label="t('classes.deleteCombo')"
              @click="deleteKey = combo.key"
            >
              <Trash2 :size="13" :stroke-width="1.75" />
            </button>
          </Tooltip>
        </div>
        <PopoverContent
          class="w-64"
          align="end"
          :title="t('classes.deleteCombo')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(event: Event) => event.preventDefault()"
        >
          <div class="flex flex-col gap-3">
            <p class="m-0 text-xs text-uf-text leading-snug">
              {{ t('classes.deleteComboHint', { name: combo.parts.join(' + ') }) }}
            </p>
            <div class="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" @click="deleteKey = null">
                {{ t('common.cancel') }}
              </Button>
              <Button type="button" variant="destructive" size="sm" @click="confirmDelete">
                {{ t('common.remove') }}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
