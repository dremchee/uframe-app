<script setup lang="ts">
import type { BoxBlockProps } from '@/core'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { BOX_TAGS } from '@/core'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<BoxBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.box.tag') }}</span>
      <Select v-model="model.tag">
        <SelectTrigger>
          <SelectValue :placeholder="t('blocks.box.tagPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in BOX_TAGS" :key="option" :value="option">
            &lt;{{ option }}&gt;
          </SelectItem>
        </SelectContent>
      </Select>
    </Label>
  </div>
</template>
