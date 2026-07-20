<script setup lang="ts">
import type { BaseBlockStyles } from '@/core'
import { Lock, Unlock } from '@lucide/vue'
import { computed } from 'vue'
import { SizeInput, Tooltip } from '@/components/ui'
import { composeGap, gapAxis, isSplitGap, mergeStyles } from '@/core'
import { useUframeI18n } from '@/vue/i18n'
import BindableField from './BindableField.vue'
import StyleField from './StyleField.vue'

// Shared gap editor for flex and grid — both expose column-gap and row-gap.
// A single `gap` shorthand by default, splittable into row/column.
const props = defineProps<{
  modelValue: BaseBlockStyles
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaseBlockStyles]
}>()

const styles = computed(() => props.modelValue)
const { t } = useUframeI18n()

function update(patch: Partial<BaseBlockStyles>) {
  emit('update:modelValue', mergeStyles(styles.value, patch))
}

// Gap lives only in the `gap` shorthand, and the VALUE FORM is the lock state:
// one token (`gap: 12px`) = linked, two tokens (`gap: 12px 12px`) = split —
// even while the axes happen to be equal. That persists the unlock in the
// document itself, so it survives selection changes / undo and the canvas gap
const effRowGap = computed(() => gapAxis(styles.value, 'row'))
const effColumnGap = computed(() => gapAxis(styles.value, 'column'))
const isGapSplit = computed(() => isSplitGap(styles.value))

function applyGap(row: string, column: string, split: boolean) {
  update({ gap: composeGap(row, column, split) })
}

function setLinkedGap(v: string) {
  applyGap(v, v, false)
}
function setColumnGap(v: string) {
  applyGap(effRowGap.value, v, true)
}
function setRowGap(v: string) {
  applyGap(v, effColumnGap.value, true)
}
function toggleGapSplit() {
  if (isGapSplit.value) {
    // Link: collapse both axes to a single value (keep the column gap).
    applyGap(effColumnGap.value, effColumnGap.value, false)
  }
  else {
    // Unlock: rewrite into the persistent two-token form. An unset gap
    // materializes as `0 0` — the split has to live somewhere.
    applyGap(effRowGap.value || '0', effColumnGap.value || '0', true)
  }
}
</script>

<template>
  <div class="grid gap-1">
    <span v-if="!isGapSplit" class="text-uf-muted text-[11px] font-semibold uppercase tracking-wider">{{ t('style.gap') }}</span>
    <div class="flex items-end gap-1">
      <div v-if="!isGapSplit" class="flex-1 min-w-0">
        <BindableField type="size" :model-value="effColumnGap" @update:model-value="setLinkedGap">
          <template #default="{ value, setValue, requestBind }">
            <SizeInput bindable :min="0" placeholder="0" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
          </template>
        </BindableField>
      </div>
      <div v-else class="flex-1 min-w-0 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
        <StyleField :label="t('style.columnGap')" :modified="effColumnGap !== ''" @reset="setColumnGap('')">
          <BindableField type="size" :model-value="effColumnGap" @update:model-value="setColumnGap">
            <template #default="{ value, setValue, requestBind }">
              <SizeInput bindable :min="0" placeholder="0" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
            </template>
          </BindableField>
        </StyleField>
        <StyleField :label="t('style.rowGap')" :modified="effRowGap !== ''" @reset="setRowGap('')">
          <BindableField type="size" :model-value="effRowGap" @update:model-value="setRowGap">
            <template #default="{ value, setValue, requestBind }">
              <SizeInput bindable :min="0" placeholder="0" :model-value="value" @request-bind="requestBind" @update:model-value="setValue" />
            </template>
          </BindableField>
        </StyleField>
      </div>
      <Tooltip :text="isGapSplit ? t('style.linkGaps') : t('style.splitGaps')">
        <button
          type="button"
          class="inline-flex items-center justify-center size-9 shrink-0 rounded-md bg-transparent text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
          :aria-label="isGapSplit ? t('style.linkGaps') : t('style.splitGaps')"
          @click="toggleGapSplit"
        >
          <component :is="isGapSplit ? Unlock : Lock" :size="14" :stroke-width="1.75" />
        </button>
      </Tooltip>
    </div>
  </div>
</template>
