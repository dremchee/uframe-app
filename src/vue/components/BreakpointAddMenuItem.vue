<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { DropdownMenuItem } from '@/components/ui'
import { useUframeI18n } from '@/vue/i18n'

const emit = defineEmits<{ select: [] }>()
const { t } = useUframeI18n()
</script>

<template>
  <DropdownMenuItem class="text-uf-accent" @select="emit('select')">
    <Plus :size="14" :stroke-width="1.75" />{{ t('breakpoints.add') }}
  </DropdownMenuItem>
</template>
