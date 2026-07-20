<script setup lang="ts">
import type { PageBlock } from '@/core'
import { Ellipsis, Pencil, Plus, Trash2, X } from '@lucide/vue'
import { computed } from 'vue'
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
} from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import ClassNameInput from '@/vue/components/ClassNameInput.vue'
import SymbolInstanceOverview from '@/vue/components/SymbolInstanceOverview.vue'
import SymbolInstancePropertiesSection from '@/vue/components/SymbolInstancePropertiesSection.vue'
import SymbolInstanceSlotsSection from '@/vue/components/SymbolInstanceSlotsSection.vue'
import { useSymbolInstancePanel } from '@/vue/composables/symbols/useSymbolInstancePanel'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  instance: PageBlock
  availableClasses: string[]
  sanitizeClassName: (raw: string) => string
}>()

const { editor } = useEditorContext()
const { t } = useUframeI18n()
const block = computed(() => props.instance)
const availableClasses = computed(() => props.availableClasses)
const {
  confirm,
  instanceSymbol,
  activeVariant,
  selectedVariantId,
  variantClassInput,
  variantForm,
  variantClassSuggestions,
  renameComponent,
  detachInstance,
  editMaster,
  openAddVariant,
  openRenameVariant,
  openDeleteVariant,
  submitVariantForm,
  setInstanceProperty,
  resetInstanceProperty,
  editInstanceSlotElement,
  resetInstanceSlot,
  applyVariantClass,
  removeVariantClass,
} = useSymbolInstancePanel({
  editor,
  block,
  availableClasses,
  sanitizeClassName: props.sanitizeClassName,
})
</script>

<template>
  <section class="min-h-0 grid gap-3 p-3 overflow-auto scrollbar-hide">
    <SymbolInstanceOverview
      :symbol="instanceSymbol"
      @edit-master="editMaster"
      @rename="renameComponent"
      @detach="detachInstance"
    />

    <SymbolInstancePropertiesSection
      v-if="instanceSymbol?.properties?.length"
      :instance="instance"
      :symbol="instanceSymbol!"
      @change="setInstanceProperty"
      @reset="resetInstanceProperty"
    />

    <SymbolInstanceSlotsSection
      v-if="instanceSymbol"
      :instance="instance"
      :symbol="instanceSymbol"
      @reset="resetInstanceSlot"
      @edit="editInstanceSlotElement"
    />

    <section v-if="instanceSymbol" class="flex flex-col gap-2">
      <Popover v-model:open="variantForm.open">
        <div class="relative flex items-center gap-1.5">
          <PopoverAnchor class="pointer-events-none absolute inset-0" />
          <label class="text-[11px] uppercase tracking-wider font-semibold text-uf-muted flex-1">
            {{ t('properties.variant') }}
          </label>
          <Tooltip :text="t('properties.addVariant')">
            <button
              type="button"
              class="inline-flex items-center justify-center h-6 w-6 border border-uf-border rounded-sm bg-uf-panel text-uf-text cursor-pointer hover:bg-uf-panel-muted"
              :aria-label="t('properties.addVariant')"
              @click="openAddVariant"
            >
              <Plus :size="12" :stroke-width="1.75" />
            </button>
          </Tooltip>
          <DropdownMenu v-if="activeVariant">
            <DropdownMenuTrigger>
              <button
                type="button"
                class="inline-flex items-center justify-center h-6 w-6 rounded-sm text-uf-muted cursor-pointer hover:bg-uf-panel-muted hover:text-uf-text"
                :aria-label="t('properties.variantActions')"
              >
                <Ellipsis :size="12" :stroke-width="1.75" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @select="openRenameVariant">
                <Pencil />
                {{ t('properties.renameVariant') }}
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="instanceSymbol.variants.length > 1"
                class="text-uf-danger data-highlighted:text-uf-danger"
                @select="openDeleteVariant"
              >
                <Trash2 />
                {{ t('properties.deleteVariant') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <PopoverContent
          class="w-64"
          align="end"
          :title="variantForm.mode === 'add' ? t('properties.newVariant') : variantForm.mode === 'rename' ? t('properties.renameVariant') : t('properties.deleteVariant')"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="(e: Event) => e.preventDefault()"
        >
          <form class="flex flex-col gap-3" @submit.prevent="submitVariantForm">
            <template v-if="variantForm.mode === 'delete'">
              <p class="m-0 text-xs text-uf-text leading-snug">
                {{ t('properties.variantDeleteHint', { name: variantForm.name }) }}
              </p>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" @click="variantForm.open = false">
                  {{ t('common.cancel') }}
                </Button>
                <Button type="submit" variant="destructive" size="sm">
                  {{ t('common.remove') }}
                </Button>
              </div>
            </template>
            <template v-else>
              <Label>
                <span>{{ t('properties.variantName') }}</span>
                <Input v-model="variantForm.name" autofocus :placeholder="t('properties.newVariant')" />
              </Label>
              <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" @click="variantForm.open = false">
                  {{ t('common.cancel') }}
                </Button>
                <Button type="submit" size="sm">
                  {{ variantForm.mode === 'add' ? t('common.add') : t('common.edit') }}
                </Button>
              </div>
            </template>
          </form>
        </PopoverContent>
      </Popover>

      <Select v-model="selectedVariantId">
        <SelectTrigger class="text-[12px]">
          <SelectValue :placeholder="t('properties.defaultVariant')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="variant in instanceSymbol.variants" :key="variant.id" :value="variant.id">
            {{ variant.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <div v-if="activeVariant" class="flex flex-col gap-1.5">
        <label class="text-[11px] uppercase tracking-wider font-semibold text-uf-muted">
          {{ t('properties.variantClasses') }}
        </label>
        <div v-if="activeVariant.classes.length" class="flex flex-wrap gap-1">
          <span
            v-for="cls in activeVariant.classes"
            :key="cls"
            class="inline-flex items-center gap-1 min-h-5.5 py-0.5 pl-2 pr-1 rounded-sm border border-uf-border bg-uf-panel text-[11px] text-uf-text"
          >
            <span>{{ cls }}</span>
            <button
              type="button"
              class="inline-flex items-center justify-center w-4 h-4 rounded-[2px] text-uf-muted cursor-pointer hover:bg-black/8 hover:text-uf-text"
              :aria-label="t('properties.removeClass', { name: cls })"
              @click="removeVariantClass(cls)"
            >
              <X :size="10" :stroke-width="2" />
            </button>
          </span>
        </div>
        <ClassNameInput
          v-model="variantClassInput"
          :suggestions="variantClassSuggestions"
          :placeholder="t('properties.addClassName')"
          @apply="applyVariantClass"
        />
        <p class="m-0 text-[10px] text-uf-muted leading-snug">
          {{ t('properties.variantClassHint') }}
        </p>
      </div>
    </section>

    <ConfirmDialog
      v-model:open="confirm.open.value"
      :title="confirm.title.value"
      :description="confirm.description.value || undefined"
      :confirm-text="confirm.confirmText.value"
      :variant="confirm.variant.value"
      @confirm="confirm.handleConfirm"
    />
  </section>
</template>
