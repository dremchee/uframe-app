<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  label?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}>(), {
})
const emit = defineEmits<{ confirm: [value: string] }>()
const { t } = useUframeI18n()
const open = defineModel<boolean>('open', { default: false })
const value = defineModel<string>('value', { default: '' })

function onSubmit() {
  const next = value.value.trim()
  if (!next)
    return
  emit('confirm', next)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md" @open-auto-focus.prevent="">
      <DialogHeader>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription v-if="props.description">
          {{ props.description }}
        </DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <Label class="gap-3">
          <span>{{ props.label ?? t('common.name') }}</span>
          <Input v-model="value" autofocus :placeholder="props.placeholder" />
        </Label>
      </form>
      <DialogFooter>
        <Button variant="outline" size="sm" @click="open = false">
          {{ props.cancelText ?? t('common.cancel') }}
        </Button>
        <Button size="sm" :disabled="!value.trim()" @click="onSubmit">
          {{ props.confirmText ?? t('common.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
