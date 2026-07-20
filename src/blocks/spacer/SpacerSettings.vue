<script setup lang="ts">
import type { SpacerBlockProps } from '@/core'
import { Label, NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldStepper } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const model = defineModel<SpacerBlockProps>({ required: true })
const { t } = useUframeI18n()
</script>

<template>
  <div class="grid gap-2">
    <Label>
      <span>{{ t('blocks.spacer.height') }}</span>
      <NumberField v-model="model.height" :min="0" :max="640">
        <NumberFieldContent>
          <NumberFieldInput />
          <NumberFieldStepper>
            <NumberFieldIncrement />
            <NumberFieldDecrement />
          </NumberFieldStepper>
        </NumberFieldContent>
      </NumberField>
    </Label>
  </div>
</template>
