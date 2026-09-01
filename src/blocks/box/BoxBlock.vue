<script setup lang="ts">
import type { BoxBlockProps } from '@/core'
import { computed } from 'vue'
import { resolveBoxTag } from '@/blocks/box/tag'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  props: BoxBlockProps
  hasChildren?: boolean
  hasBox?: boolean
}>()

const { t } = useUframeI18n()
const tag = computed(() => resolveBoxTag(props.props.tag))
</script>

<template>
  <component :is="tag" class="uf-box-block">
    <slot />
    <div v-if="!hasChildren && !hasBox" class="uf-container-placeholder">
      {{ t('canvas.emptyBox') }}
    </div>
  </component>
</template>
