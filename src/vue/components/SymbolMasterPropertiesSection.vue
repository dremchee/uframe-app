<script setup lang="ts">
import type { PageBlock, SymbolDefinition } from '@/core'
import { Pencil, Plus, Trash2, Variable } from '@lucide/vue'
import {
  Button,
  IconButton,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useSymbolMasterProperties } from '@/vue/composables/symbols/useSymbolMasterProperties'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  block: PageBlock
  symbol: SymbolDefinition
}>()

const emit = defineEmits<{
  expose: [prop: string, label?: string]
  remove: [propertyId: string]
  rename: [propertyId: string, label: string]
}>()

const { t } = useUframeI18n()
const {
  addForm,
  candidates,
  exposedProperties,
  namePlaceholder,
  onAddOpenChange,
  openRename,
  propertyLabel,
  renameId,
  renameValue,
  submitAdd,
  submitRename,
} = useSymbolMasterProperties({
  block: () => props.block,
  symbol: () => props.symbol,
  expose: (prop, label) => emit('expose', prop, label),
  rename: (propertyId, label) => emit('rename', propertyId, label),
})
</script>

<template>
  <section class="flex flex-col gap-2">
    <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">
      {{ t('properties.componentProperties') }}
    </span>

    <div v-if="exposedProperties.length" class="flex flex-col gap-1">
      <div
        v-for="property in exposedProperties"
        :key="property.id"
        class="group flex items-center gap-1.5 h-8 pl-2 pr-1 rounded-md border border-uf-border bg-uf-panel"
      >
        <div
          class="flex-1 min-w-0 flex items-center gap-1.5"
          :title="`${property.key} · ${property.control.type} · ${property.target.prop}`"
        >
          <Variable :size="13" :stroke-width="1.75" class="shrink-0 text-uf-muted" />
          <span class="truncate text-[12px] text-uf-text">{{ propertyLabel(property) }}</span>
        </div>
        <span class="shrink-0 text-[11px] text-uf-muted">{{ property.target.prop }}</span>

        <Popover
          :open="renameId === property.id"
          @update:open="(o: boolean) => (o ? openRename(property) : (renameId = null))"
        >
          <PopoverTrigger as-child>
            <IconButton size="sm" :aria-label="t('properties.renameProperty')">
              <Pencil :size="13" :stroke-width="1.75" />
            </IconButton>
          </PopoverTrigger>
          <PopoverContent
            class="w-60"
            align="end"
            :title="t('properties.renameProperty')"
            @interact-outside="preventOverlayDismiss"
            @focus-outside="(e: Event) => e.preventDefault()"
          >
            <form class="flex flex-col gap-3" @submit.prevent="submitRename">
              <Label>
                <span>{{ t('properties.propertyName') }}</span>
                <Input v-model="renameValue" autofocus :placeholder="t('properties.propertyName')" />
              </Label>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" @click="renameId = null">
                  {{ t('common.cancel') }}
                </Button>
                <Button type="submit" size="sm">
                  {{ t('common.edit') }}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        <IconButton
          size="sm"
          class="hover:text-uf-danger"
          :aria-label="t('properties.removeProperty', { name: propertyLabel(property) })"
          @click="emit('remove', property.id)"
        >
          <Trash2 :size="13" :stroke-width="1.75" />
        </IconButton>
      </div>
    </div>

    <Popover v-if="candidates.length" :open="addForm.open" @update:open="onAddOpenChange">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" class="w-full">
          <Plus data-icon="inline-start" />
          {{ t('properties.addProperty') }}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-64"
        align="start"
        :title="t('properties.addProperty')"
        @interact-outside="preventOverlayDismiss"
        @focus-outside="(e: Event) => e.preventDefault()"
      >
        <form class="flex flex-col gap-3" @submit.prevent="submitAdd">
          <Label>
            <span>{{ t('properties.property') }}</span>
            <Select v-model="addForm.prop">
              <SelectTrigger class="w-full text-xs">
                <SelectValue :placeholder="t('properties.selectProperty')" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="candidate in candidates" :key="candidate.prop" :value="candidate.prop">
                    {{ candidate.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Label>
          <Label>
            <span>{{ t('properties.propertyName') }}</span>
            <Input v-model="addForm.name" :placeholder="namePlaceholder" />
          </Label>
          <div class="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" @click="addForm.open = false">
              {{ t('common.cancel') }}
            </Button>
            <Button type="submit" size="sm" :disabled="!addForm.prop">
              {{ t('common.add') }}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>

    <p v-else-if="!exposedProperties.length" class="m-0 text-[11px] leading-snug text-uf-muted">
      {{ t('properties.noScalarProperties') }}
    </p>
  </section>
</template>
