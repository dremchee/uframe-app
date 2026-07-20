<script setup lang="ts">
import type { OptionDraft } from './OptionForm.vue'
import type { PageBlock, SelectBlockProps, SelectOptionBlockProps } from '@/core'
import { Plus } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Input, Label, Popover, PopoverContent, PopoverTrigger, Switch } from '@/components/ui'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'
import OptionForm from './OptionForm.vue'
import OptionRow from './OptionRow.vue'

const model = defineModel<SelectBlockProps>({ required: true })

// Options are `select-option` child blocks, edited here through the editor (the
// panel shows this select; its children are the options).
const { editor } = useEditorContext()
const { t } = useUframeI18n()
const block = computed(() => editor.selectedBlock.value)
const options = computed(
  () => (block.value?.children ?? []).filter(c => c.type === 'select-option') as unknown as PageBlock<SelectOptionBlockProps>[],
)

// ── Add via popover ──────────────────────────────────────────────────────────
const addOpen = ref(false)
const addDraft = ref<OptionDraft>({ label: '', value: '', selected: false })

function onAddOpenChange(open: boolean) {
  if (open)
    addDraft.value = { label: '', value: '', selected: false }
  addOpen.value = open
}

// A select has a single default — clearing the flag on every other option keeps
// only `exceptId` marked.
function clearOtherDefaults(exceptId: string) {
  for (const o of options.value) {
    if (o.id !== exceptId && o.props.selected)
      editor.updateBlockProps(o.id, { selected: false })
  }
}

function submitAdd() {
  const id = block.value?.id
  if (id) {
    editor.beginTransient()
    editor.addBlock('select-option', id)
    // addBlock appends and selects the new child; capture it, restore focus to
    // the select (so `options` reflects the select's children), then set props.
    const newId = editor.selectedBlock.value?.id
    editor.selectBlock(id)
    if (newId) {
      editor.updateBlockProps(newId, addDraft.value)
      if (addDraft.value.selected)
        clearOtherDefaults(newId)
    }
    editor.endTransient()
  }
  addOpen.value = false
}

function updateOption(optionId: string, draft: OptionDraft) {
  editor.beginTransient()
  editor.updateBlockProps(optionId, { label: draft.label, value: draft.value, selected: draft.selected })
  if (draft.selected)
    clearOtherDefaults(optionId)
  editor.endTransient()
}

function removeOption(optionId: string) {
  editor.removeBlock(optionId)
}

function reorderOptions(from: number, to: number) {
  const id = block.value?.id
  const opt = options.value[from]
  if (id && opt)
    editor.moveBlockTo(opt.id, id, to)
}
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.select.name') }}</span>
      <Input v-model="model.name" type="text" :placeholder="t('blocks.select.namePlaceholder')" />
    </Label>

    <div class="mt-2 grid gap-1.5">
      <span class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">{{ t('blocks.select.options') }}</span>
      <OptionRow
        v-for="(opt, i) in options"
        :key="opt.id"
        :option="{ id: opt.id, label: opt.props.label ?? '', value: opt.props.value ?? '', selected: opt.props.selected ?? false }"
        :index="i"
        @update="updateOption"
        @remove="removeOption"
        @reorder="reorderOptions"
      />
      <p v-if="!options.length" class="text-uf-muted text-[11px] leading-snug">
        {{ t('blocks.select.noOptions') }}
      </p>

      <Popover :open="addOpen" @update:open="onAddOpenChange">
        <PopoverTrigger
          class="flex w-full items-center justify-center gap-1.5 h-8 rounded-md border border-input bg-transparent px-3 text-xs font-medium text-uf-text transition-colors hover:bg-uf-panel-muted data-[state=open]:bg-uf-panel-muted"
        >
          <Plus :size="14" :stroke-width="2" />
          {{ t('blocks.select.addOption') }}
        </PopoverTrigger>
        <PopoverContent
          class="w-60"
          align="start"
          @interact-outside="preventOverlayDismiss"
          @focus-outside="preventOverlayDismiss"
        >
          <div class="mb-2 text-sm font-semibold text-uf-text">
            {{ t('blocks.select.newOption') }}
          </div>
          <OptionForm
            v-model="addDraft"
            :submit-label="t('common.add')"
            @submit="submitAdd"
            @cancel="onAddOpenChange(false)"
          />
        </PopoverContent>
      </Popover>
    </div>

    <div class="mt-2 flex flex-col gap-3">
      <Switch v-model="model.required">
        {{ t('blocks.select.required') }}
      </Switch>
      <Switch v-model="model.disabled">
        {{ t('blocks.select.disabled') }}
      </Switch>
    </div>
  </div>
</template>
