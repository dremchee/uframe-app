<script setup lang="ts">
import { Info, Undo } from '@lucide/vue'
import { computed, inject } from 'vue'
import { Tooltip } from '@/components/ui'
import { STYLE_INHERITANCE_KEY } from '@/vue/composables/style/useStyleInheritance'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  label: string
  /** Single style key this field controls — auto-wires the reset via context. */
  field?: string
  /**
   * Explicit "has overrides" flag for composite fields (e.g. a border radius
   * spanning four corners) that can't be expressed as one key. When set, the
   * field emits `reset` instead of clearing a key through the context.
   */
  modified?: boolean
  /** Info note shown as an (i) icon + tooltip next to the label. */
  hint?: string
}>()

const emit = defineEmits<{
  reset: []
}>()
const { t } = useUframeI18n()

interface StyleResetContext {
  isSet: (key: string) => boolean
  reset: (key: string) => void
}

// Provided by StylePanel. Optional so StyleField still works elsewhere (e.g.
// BorderControl) where fields don't map to a single resettable key.
const resetCtx = inject<StyleResetContext | null>('styleFieldReset', null)
// Provided by PropertiesPanel: values the selected block inherits from its
// ancestors (only properties an ancestor actually authored).
const inheritCtx = inject(STYLE_INHERITANCE_KEY, null)

const canReset = computed(() =>
  props.field ? !!resetCtx?.isSet(props.field) : !!props.modified,
)

// Webflow-style amber: the field's value comes from a parent and isn't
// overridden on the current target. An own value (accent) wins the tint.
const inherited = computed(() =>
  props.field && !canReset.value ? inheritCtx?.get(props.field) : undefined,
)

function reset() {
  if (props.field)
    resetCtx?.reset(props.field)
  else
    emit('reset')
}
</script>

<template>
  <!-- Intentionally a <div>, not a <label>: a wrapping <label> associates with
       its first labelable descendant (the reset <button>), and browsers forward
       the label's :hover to that control — so hovering the label text lit up the
       reset icon. A div has no such association. -->
  <!-- `grid-cols-[minmax(0,1fr)]` (not a bare `grid`): a single implicit `auto`
       column grows to its content's max-content and can exceed this field's
       width (grid blowout), clipping wide controls. minmax(0,1fr) caps it. -->
  <div class="group grid grid-cols-[minmax(0,1fr)] gap-1">
    <span class="relative flex items-center text-uf-muted text-[11px] font-semibold uppercase tracking-wider">
      <Tooltip v-if="inherited" :text="`Inherited from ${inherited.from}: ${inherited.value}`">
        <span class="truncate cursor-help text-amber-500 dark:text-amber-400">{{ label }}</span>
      </Tooltip>
      <span v-else class="truncate" :class="canReset ? 'text-uf-accent' : ''">{{ label }}</span>
      <Tooltip v-if="hint" :text="hint">
        <span class="ml-1 inline-flex shrink-0 cursor-help" tabindex="0">
          <Info :size="12" :stroke-width="2" :aria-label="t('style.moreInfo')" />
        </span>
      </Tooltip>
      <!-- Absolutely positioned so it never affects the label row height. -->
      <Tooltip v-if="canReset" :text="t('style.reset', { label })">
        <button
          type="button"
          class="absolute right-0 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded text-uf-muted opacity-0 outline-none transition-[opacity,color] hover:text-uf-text hover:bg-uf-panel-muted focus-visible:opacity-100 group-hover:opacity-100"
          :aria-label="t('style.reset', { label })"
          @click.stop="reset"
        >
          <Undo :size="12" :stroke-width="2" />
        </button>
      </Tooltip>
    </span>
    <!-- When overridden, tint the control's value (input text) in the brand
         colour. Placeholders keep their own muted colour, so only real values
         light up. -->
    <div :class="canReset ? '[&_input]:text-uf-accent [&_.uf-ui-select-trigger]:text-uf-accent' : ''">
      <slot />
    </div>
  </div>
</template>
