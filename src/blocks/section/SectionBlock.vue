<script setup lang="ts">
import type { SectionBlockProps } from '@/core'
import { useUframeI18n } from '@/vue/i18n'

defineProps<{
  props: SectionBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()

const { t } = useUframeI18n()
</script>

<template>
  <section class="uf-section-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      {{ t('canvas.emptySection') }}
    </div>
  </section>
</template>
