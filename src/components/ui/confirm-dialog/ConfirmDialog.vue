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
import { useUframeI18n } from '@/vue/i18n'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}>(), {
  variant: 'default',
})
const emit = defineEmits<{ confirm: [] }>()

const { t } = useUframeI18n()

const open = defineModel<boolean>('open', { default: false })

function onConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription v-if="props.description">
          {{ props.description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" size="sm" @click="open = false">
          {{ props.cancelText ?? t('common.cancel') }}
        </Button>
        <Button :variant="variant" size="sm" @click="onConfirm">
          {{ props.confirmText ?? t('common.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
