<script setup lang="ts">
import type { SymbolDefinition } from '@/core'
import { Component as ComponentIcon } from '@lucide/vue'
import { ref } from 'vue'
import { Button, Card, CardDescription, CardTitle, Input, Label, Popover, PopoverAnchor, PopoverContent, Tooltip } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  symbol?: SymbolDefinition
}>()

const emit = defineEmits<{
  editMaster: []
  rename: [name: string]
  detach: []
}>()

const { t } = useUframeI18n()
const renameForm = ref({ open: false, name: '' })

function openRename() {
  if (!props.symbol)
    return
  renameForm.value = { open: true, name: props.symbol.name }
}

function submitRename() {
  const name = renameForm.value.name.trim()
  if (!name)
    return
  emit('rename', name)
  renameForm.value.open = false
}
</script>

<template>
  <Card class="flex flex-col gap-3 p-4">
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <ComponentIcon :size="16" :stroke-width="1.75" class="text-uf-symbol shrink-0" />
        <CardTitle class="flex-1 min-w-0 truncate text-sm text-uf-symbol">
          {{ symbol?.name ?? t('properties.missingComponent') }}
        </CardTitle>
      </div>
      <CardDescription class="text-xs leading-snug">
        {{ t('properties.masterEdits') }}
      </CardDescription>
    </div>
    <Button
      v-if="symbol"
      variant="default"
      size="sm"
      class="w-full bg-uf-symbol text-white hover:bg-uf-symbol/90"
      @click="emit('editMaster')"
    >
      {{ t('properties.editMaster') }}
    </Button>
    <div class="grid grid-cols-2 gap-2">
      <Popover v-if="symbol" v-model:open="renameForm.open">
        <div class="relative">
          <PopoverAnchor class="pointer-events-none absolute inset-0" />
          <Button variant="outline" size="sm" class="w-full" @click="openRename">
            {{ t('common.edit') }}
          </Button>
        </div>
        <PopoverContent
          class="w-64"
          align="start"
          :title="t('properties.renameComponent')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(event: Event) => event.preventDefault()"
        >
          <form class="flex flex-col gap-3" @submit.prevent="submitRename">
            <Label>
              <span>{{ t('properties.componentName') }}</span>
              <Input v-model="renameForm.name" autofocus :placeholder="t('properties.componentName')" />
            </Label>
            <p class="m-0 text-[11px] text-uf-muted leading-snug">
              {{ t('properties.componentNameHint') }}
            </p>
            <div class="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" @click="renameForm.open = false">
                {{ t('common.cancel') }}
              </Button>
              <Button type="submit" size="sm">
                {{ t('common.edit') }}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
      <Tooltip v-if="symbol" :text="t('properties.detachHint')">
        <Button variant="outline" size="sm" @click="emit('detach')">
          {{ t('properties.detach') }}
        </Button>
      </Tooltip>
    </div>
  </Card>
</template>
