<script setup lang="ts">
import type { FieldSchema } from '@/core'
import { ChevronDown, Eraser } from '@lucide/vue'
import { computed } from 'vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip } from '@/components/ui'
import { findDataScopeCollection } from '@/core'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

// The binding control for one prop (the label is rendered by BindingsSection,
// matching the style-settings field layout). A select-like dropdown showing the
// current binding (or "Static"); picking a field writes block.bindings[prop],
// the block's own prop value staying as the editor-time fallback. Field options
// come from the nearest enclosing Data List/Item's collection.
const props = defineProps<{ prop: string }>()

const { editor, schema } = useEditorContext()
const { t } = useUframeI18n()

const block = computed(() => editor.selectedBlock.value)
const currentPath = computed(() => block.value?.bindings?.[props.prop])
const bound = computed(() => Boolean(currentPath.value))

const scopeCollection = computed(() =>
  block.value ? findDataScopeCollection(editor.document.value.blocks, block.value.id) : null,
)

// Scalar/file fields bind to a text/src prop; relations (objects/lists) don't.
const fields = computed<FieldSchema[]>(() => {
  const name = scopeCollection.value
  if (!name)
    return []
  const collection = schema.value.collections.find(c => c.name === name)
  return (collection?.fields ?? []).filter(f => f.type !== 'relation')
})

function pick(field: FieldSchema) {
  if (block.value)
    editor.setBlockBinding(block.value.id, props.prop, `item.${field.name}`)
}

function unbind() {
  if (block.value)
    editor.setBlockBinding(block.value.id, props.prop, null)
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          type="button"
          :title="bound ? t('properties.boundTo', { path: currentPath ?? '' }) : t('properties.bindToField')"
          class="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm cursor-pointer transition-colors hover:bg-uf-panel-muted data-[state=open]:bg-uf-panel-muted"
        >
          <span class="truncate" :class="bound ? 'text-uf-accent' : 'text-uf-muted'">
            {{ currentPath ?? t('properties.static') }}
          </span>
          <ChevronDown :size="14" :stroke-width="2" class="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="min-w-44">
        <DropdownMenuItem
          v-for="field in fields"
          :key="field.name"
          :class="currentPath === `item.${field.name}` ? 'text-uf-accent' : ''"
          @select="pick(field)"
        >
          <span class="flex-1">{{ field.label ?? field.name }}</span>
          <span class="text-[11px] text-uf-muted">{{ field.type }}</span>
        </DropdownMenuItem>

        <DropdownMenuItem v-if="!fields.length" disabled>
          {{ t('properties.noBindableFields') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Tooltip v-if="bound" :text="t('properties.unbind')">
      <button
        type="button"
        :aria-label="t('properties.unbind')"
        class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-uf-muted cursor-pointer transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
        @click="unbind"
      >
        <Eraser :size="14" :stroke-width="2" />
      </button>
    </Tooltip>
  </div>
</template>
