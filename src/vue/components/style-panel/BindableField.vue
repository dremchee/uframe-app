<script setup lang="ts">
import type { CssVarType } from '@/core'
import type { VariableDraft } from '@/vue/components/VariableForm.vue'
import { Link2, Plus, X } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import { Button, Popover, PopoverAnchor, PopoverContent, Tooltip } from '@/components/ui'
import { parseVarRef, toVarRef } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import VariableForm from '@/vue/components/VariableForm.vue'
import { useVariableResolver } from '@/vue/composables/style/useVariableResolver'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  modelValue: string
  /** Which variable type this field accepts — the picker is filtered to it. */
  type: CssVarType
  /**
   * Render a built-in trigger icon on the right edge of the control. Used by
   * controls without a natural slot for the action (ColorInput, text Input).
   * SizeInput instead surfaces the action inside its unit dropdown and drives
   * the picker through the exposed `requestBind` slot prop.
   */
  iconTrigger?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
const { t } = useUframeI18n()

const { ofType, get, resolve, add } = useVariableResolver()

// The field is "bound" whenever its value is a bare `var(--key)` reference.
// `parseVarRef` yields the stable CSS key; we resolve it to the variable for
// its display label + swatch.
const boundKey = computed(() => parseVarRef(props.modelValue))
const boundVar = computed(() => (boundKey.value ? get(boundKey.value) : undefined))
const isMissing = computed(() => boundKey.value != null && !boundVar.value)
const isColor = computed(() => props.type === 'color')

const options = computed(() => ofType(props.type))

// Resolved concrete value, used to paint the colour swatch in the chip.
const swatch = computed(() => resolve(props.modelValue))

function setValue(value: string) {
  emit('update:modelValue', value)
}

// ── Picker ──────────────────────────────────────────────────────────────────
const open = ref(false)
const mode = ref<'list' | 'create'>('list')

function requestBind() {
  mode.value = 'list'
  // Open next frame so a closing select/menu (the unit dropdown) settles first.
  requestAnimationFrame(() => {
    open.value = true
  })
}

// Never dismiss on focus changes: focus-outside is unreliable across browsers
// and fights nested overlays (the type Select / native colour picker in the
// create form, the unit dropdown's focus-return). Closing is driven by outside
// clicks (interact-outside) and the canvas-iframe blur handler instead.
function onFocusOutside(event: Event) {
  event.preventDefault()
}

// The canvas is an <iframe>: clicking into it never reaches the parent
// document's pointerdown listener, so interact-outside can't fire. The parent
// window does get a `blur` with focus on the iframe — close on that. Guard on
// tagName so a native picker dialog (e.g. <input type=color> in the create
// form, which keeps activeElement on the input) doesn't dismiss us.
useEventListener(window, 'blur', () => {
  if (open.value && document.activeElement?.tagName === 'IFRAME')
    open.value = false
})

function pick(key: string) {
  setValue(toVarRef(key))
  open.value = false
}

// Detach: drop the reference but keep the variable's current value so there's a
// concrete value left to edit. A dangling ref simply clears the field.
function detach() {
  setValue(boundVar.value?.value ?? '')
}

// ── Inline creation ─────────────────────────────────────────────────────────
// Seed the new variable with the field's current concrete value (and type), so
// the user only has to name it; on save we create and bind in one step.
const createDraft = ref<VariableDraft>({ name: '', val: '', type: props.type })

function startCreate() {
  createDraft.value = { name: '', val: resolve(props.modelValue), type: props.type }
  mode.value = 'create'
}

async function submitCreate() {
  const name = add({
    name: createDraft.value.name,
    value: createDraft.value.val,
    type: createDraft.value.type,
  })
  // Creating the variable commits a document change, which re-syncs the
  // properties panel's local style buffer (reloadActiveStyle). Bind on the next
  // tick so that re-sync doesn't clobber the var() reference we set here —
  // otherwise the variable is saved but never applied to the field.
  await nextTick()
  setValue(toVarRef(name))
  open.value = false
}

// PopoverContent portals to <body>, outside the app's style reset, so bare
// <button>s would otherwise pick up the UA's grey face + border. Reset them
// explicitly, matching how DropdownMenuItem/SelectItem style themselves.
const menuItem = 'flex h-8 w-full appearance-none items-center gap-2 rounded border-0 px-2 text-left text-xs transition-colors hover:bg-uf-panel-muted'
</script>

<template>
  <Popover v-model:open="open">
    <div class="relative">
      <!-- Anchors the picker under the whole field, regardless of trigger. -->
      <PopoverAnchor class="pointer-events-none absolute inset-0" />

      <!-- Bound: a chip replaces the control. Click to rebind, ✕ to detach. -->
      <div
        v-if="boundKey"
        class="flex h-9 w-full items-center gap-2 rounded-md border pl-1.5 pr-1 text-sm"
        :class="isMissing ? 'border-amber-400/60 bg-amber-500/10' : 'border-uf-accent/50 bg-uf-accent/10'"
      >
        <span
          v-if="isColor"
          class="size-4 shrink-0 rounded-sm border border-input"
          :class="isMissing ? 'border-dashed' : ''"
          :style="{ backgroundColor: isMissing ? 'transparent' : swatch }"
        />
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          :aria-label="t('style.changeVariable')"
          @click="requestBind"
        >
          <span
            class="min-w-0 flex-1 truncate text-xs"
            :class="isMissing ? 'text-amber-600 dark:text-amber-400' : 'text-uf-accent'"
          >{{ boundVar?.name ?? boundKey }}</span>
          <span v-if="isMissing" class="shrink-0 text-[10px] uppercase tracking-wide text-amber-500" :title="t('style.variableMissing')">{{ t('style.missing') }}</span>
        </button>
        <button
          type="button"
          class="grid size-6 shrink-0 place-items-center rounded text-uf-muted transition-colors"
          :class="isMissing
            ? 'hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400'
            : 'hover:bg-uf-accent/15 hover:text-uf-accent'"
          :aria-label="t('style.detachVariable')"
          @click="detach"
        >
          <X :size="13" :stroke-width="2" />
        </button>
      </div>

      <!-- Unbound: the raw control, plus an optional right-edge trigger icon. -->
      <template v-else>
        <slot :value="modelValue" :set-value="setValue" :request-bind="requestBind" />
        <Tooltip v-if="iconTrigger" :text="t('style.variables')">
          <button
            type="button"
            class="absolute right-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-uf-muted transition-colors hover:bg-uf-panel-muted hover:text-uf-text"
            :aria-label="t('style.variables')"
            @click="requestBind"
          >
            <Link2 :size="14" :stroke-width="1.8" />
          </button>
        </Tooltip>
      </template>
    </div>

    <PopoverContent
      class="w-64 p-0"
      :title="t('style.bindVariable')"
      body-class="p-0"
      align="start"
      @interact-outside="preventOverlayDismiss"
      @focus-outside="onFocusOutside"
    >
      <div v-if="mode === 'list'" class="p-1">
        <div class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-uf-muted">
          {{ t('style.variablesOfType', { type }) }}
        </div>
        <p
          v-if="!options.length"
          class="px-2 pb-1 pt-0.5 text-center text-[12px] leading-snug text-uf-muted"
        >
          {{ t('style.noVariables') }}
        </p>
        <ul class="m-0 flex max-h-56 list-none flex-col gap-px overflow-auto p-0 scrollbar-hide">
          <li v-for="variable in options" :key="variable.key" class="contents">
            <button
              type="button"
              :class="[menuItem, boundKey === variable.key ? 'bg-uf-panel-muted' : 'bg-transparent']"
              @click="pick(variable.key)"
            >
              <span
                v-if="isColor"
                class="size-4 shrink-0 rounded-sm border border-input"
                :style="{ backgroundColor: resolve(variable.value) || 'transparent' }"
              />
              <span class="min-w-0 flex-1 truncate text-uf-text">{{ variable.name }}</span>
              <span class="shrink-0 max-w-[45%] truncate font-mono text-[11px] text-uf-muted">{{ variable.value || '—' }}</span>
            </button>
          </li>
        </ul>
        <div class="mt-1 px-1 pb-0.5 pt-1">
          <Button variant="outline" size="sm" class="w-full" @click="startCreate">
            <Plus :size="14" :stroke-width="2" />
            {{ t('style.newVariable') }}
          </Button>
        </div>
      </div>

      <div v-else class="p-3">
        <div class="mb-2 text-sm font-semibold text-uf-text">
          {{ t('style.newVariableOfType', { type }) }}
        </div>
        <VariableForm
          v-model="createDraft"
          :submit-label="t('style.createAndApply')"
          @submit="submitCreate"
          @cancel="mode = 'list'"
        />
      </div>
    </PopoverContent>
  </Popover>
</template>
