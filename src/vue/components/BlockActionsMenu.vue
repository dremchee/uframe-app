<script setup lang="ts">
import type { PageBlock } from '@/core'
import { Copy, Eye, EyeOff, Group, PackagePlus, Pencil, Trash2, Ungroup } from '@lucide/vue'
import { computed, ref } from 'vue'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui'
import { SYMBOL_INSTANCE_BLOCK_TYPE } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import { useEditorContext } from '@/vue/context/editor-context'
import { useUframeI18n } from '@/vue/i18n'

/**
 * The shared block-actions dropdown — one menu for the navigator rows and the
 * properties-panel header, so the action set can't drift apart. The host
 * renders its own trigger button through the default slot; `v-model:open`
 * exposes the menu state (the tree row keeps its hover cluster visible while
 * the menu is up).
 */
const props = defineProps<{
  block: PageBlock
  renamable?: boolean
}>()

const emit = defineEmits<{
  rename: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { editor } = useEditorContext()
const { t } = useUframeI18n()

const isSymbolInstance = computed(() => props.block.type === SYMBOL_INSTANCE_BLOCK_TYPE)
const isHidden = computed(() => !!props.block.hidden)

// "Create component" opens an anchored popover over the trigger (the panel's
// inline-form pattern — no modal): name it, submit, the block becomes an
// instance of the new component.
const createOpen = ref(false)
const createName = ref('')
const keepFocusAfterRename = ref(false)

function renameBlock() {
  keepFocusAfterRename.value = true
  emit('rename')
}

function preventRenameFocusRestore(event: Event) {
  if (!keepFocusAfterRename.value)
    return

  event.preventDefault()
  keepFocusAfterRename.value = false
}

function openCreateComponent() {
  createName.value = t('blockActions.componentPlaceholder')
  createOpen.value = true
}

function submitCreateComponent() {
  const name = createName.value.trim()
  if (!name)
    return
  if (editor.saveBlockAsSymbol(props.block.id, name))
    createOpen.value = false
}
</script>

<template>
  <Popover v-model:open="createOpen">
    <div class="relative inline-flex">
      <PopoverAnchor class="pointer-events-none absolute inset-0" />
      <DropdownMenu v-model:open="open">
        <DropdownMenuTrigger>
          <slot />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="min-w-40"
          @close-auto-focus="preventRenameFocusRestore"
        >
          <DropdownMenuItem @select="editor.duplicateBlock(block.id)">
            <Copy :size="14" :stroke-width="1.75" />
            {{ t('blockActions.duplicate') }}
          </DropdownMenuItem>
          <DropdownMenuItem v-if="renamable" @select="renameBlock">
            <Pencil :size="14" :stroke-width="1.75" />
            {{ t('blockActions.rename') }}
          </DropdownMenuItem>
          <DropdownMenuItem @select="editor.wrapBlock(block.id)">
            <Group :size="14" :stroke-width="1.75" />
            {{ t('blockActions.wrap') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="block.children?.length && !isSymbolInstance"
            @select="editor.unwrapBlock(block.id)"
          >
            <Ungroup :size="14" :stroke-width="1.75" />
            {{ t('blockActions.unwrap') }}
          </DropdownMenuItem>
          <DropdownMenuItem v-if="!isSymbolInstance" @select="openCreateComponent">
            <PackagePlus :size="14" :stroke-width="1.75" />
            {{ t('blockActions.createComponent') }}
          </DropdownMenuItem>
          <DropdownMenuItem @select="editor.setBlockHidden(block.id, !isHidden)">
            <component :is="isHidden ? Eye : EyeOff" :size="14" :stroke-width="1.75" />
            {{ isHidden ? t('blockActions.show') : t('blockActions.hide') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-uf-danger data-highlighted:text-uf-danger"
            @select="editor.removeBlock(block.id)"
          >
            <Trash2 :size="14" :stroke-width="1.75" />
            {{ t('blockActions.delete') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <PopoverContent
      class="w-64"
      align="end"
      :title="t('blockActions.createComponent')"
      @interact-outside="preventOverlayDismiss"
      @focus-outside="(e: Event) => e.preventDefault()"
    >
      <form class="flex flex-col gap-3" @submit.prevent="submitCreateComponent">
        <Label>
          <span>{{ t('blockActions.componentName') }}</span>
          <Input v-model="createName" autofocus :placeholder="t('blockActions.componentPlaceholder')" />
        </Label>
        <p class="m-0 text-[11px] text-uf-muted leading-snug">
          {{ t('blockActions.componentHint') }}
        </p>
        <div class="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" @click="createOpen = false">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" size="sm">
            {{ t('blockActions.create') }}
          </Button>
        </div>
      </form>
    </PopoverContent>
  </Popover>
</template>
