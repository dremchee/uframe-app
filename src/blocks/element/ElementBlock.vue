<script setup lang="ts">
import type { ElementBlockProps } from '@/core'
import { computed } from 'vue'
import { resolveElementTag } from '@/blocks/element/tag'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  props: ElementBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()

const { t } = useUframeI18n()
const tag = computed(() => resolveElementTag(props.props.tag))
</script>

<template>
  <component :is="tag" class="uf-element-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      {{ t('canvas.emptyElement') }}
    </div>
  </component>
</template>
