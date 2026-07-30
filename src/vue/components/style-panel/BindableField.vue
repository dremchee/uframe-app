<script setup lang="ts">
import type { CssVarType } from '@/core'
import type { VariableDraft } from '@/vue/components/VariableForm.vue'
import { Link2, Plus, X } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { Button, Popover, PopoverAnchor, PopoverContent, Tooltip } from '@/components/ui'
import { parseVarRef, toVarRef } from '@/core'
import { preventOverlayDismiss } from '@/lib/overlay-guard'
import VariableForm from '@/vue/components/VariableForm.vue'
import { useVariableResolver } from '@/vue/composables/style/useVariableResolver'
import { usePanelEdgePopover } from '@/vue/context/panel-popover-anchor'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  modelValue: string
  /** Effective inherited value, used for a read-only inherited variable chip and preview. */
  inheritedValue?: string
  /** Keep the native control available when the value is a variable reference.
   * The slot receives the variable metadata separately. */
  preserveControl?: boolean
  /** Which variable type this field accepts — the picker is filtered to it. */
  type: CssVarType
  /**
   * Render a built-in trigger icon on the right edge of the control. Used by
   * controls without a natural slot for the action (ColorInput, text Input).
   * Basic controls drive this picker through the exposed `requestBind` slot
   * prop. AdvancedSizeInput consumes the filtered `variables` slot prop and
   * renders variables together with CSS functions in its own menu.
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
// A local literal colour overrides an inherited variable just like a local
// variable does. Only surface the inherited source while this field is empty.
const inheritedKey = computed(() => props.modelValue ? null : parseVarRef(props.inheritedValue))
const displayedKey = computed(() => boundKey.value ?? inheritedKey.value)
const displayedVar = computed(() => (displayedKey.value ? get(displayedKey.value) : undefined))
const isInherited = computed(() => !props.modelValue && !!inheritedKey.value)
const isMissing = computed(() => displayedKey.value != null && !displayedVar.value)
const isColor = computed(() => props.type === 'color')

const options = computed(() => ofType(props.type))
const fieldEl = useTemplateRef<HTMLElement>('fieldEl')
const { side: popoverSide, reference: popoverReference } = usePanelEdgePopover(fieldEl)

// Resolved concrete value, used to paint a local/inherited colour preview.
const swatch = computed(() => resolve(props.modelValue || props.inheritedValue || ''))

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

// Detach: drop a local reference but keep the variable's current value so
// there's a concrete value left to edit. Inherited references are read-only.
function detach() {
  setValue(displayedVar.value?.value ?? '')
}

// ── Inline creation ─────────────────────────────────────────────────────────
// Seed the new variable with the field's current concrete value (and type), so
// the user only has to name it; on save we create and bind in one step.
const createDraft = ref<VariableDraft>({ name: '', val: '', type: props.type })

function startCreate() {
  createDraft.value = { name: '', val: resolve(props.modelValue), type: props.type }
  mode.value = 'create'
}

function requestCreate() {
  startCreate()
  requestAnimationFrame(() => {
    open.value = true
  })
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
    <div ref="fieldEl" class="relative">
      <!-- Anchors the picker under the whole field, regardless of trigger. -->
      <PopoverAnchor class="pointer-events-none absolute inset-0" />

      <!-- A local or inherited variable replaces the raw control. The inherited
           form uses the same amber language as StyleField inheritance. -->
      <div
        v-if="displayedKey && !preserveControl"
        class="flex h-9 w-full items-center gap-2 rounded-md border pl-1.5 pr-1 text-sm"
        :class="isMissing || isInherited ? 'border-amber-400/60 bg-amber-500/10' : 'border-uf-accent/50 bg-uf-accent/10'"
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
            :class="isMissing || isInherited ? 'text-amber-600 dark:text-amber-400' : 'text-uf-accent'"
          >{{ displayedVar?.name ?? displayedKey }}</span>
          <span v-if="isMissing" class="shrink-0 text-[10px] uppercase tracking-wide text-amber-500" :title="t('style.variableMissing')">{{ t('style.missing') }}</span>
        </button>
        <button
          v-if="!isInherited"
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
        <slot
          :value="modelValue"
          :set-value="setValue"
          :resolved-value="swatch"
          :source-key="displayedKey"
          :source-variable="displayedVar"
          :is-inherited-source="isInherited"
          :request-bind="requestBind"
          :request-create="requestCreate"
          :variables="options"
        />
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
      :side="popoverSide"
      :side-offset="5"
      :collision-padding="5"
      :reference="popoverReference"
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
