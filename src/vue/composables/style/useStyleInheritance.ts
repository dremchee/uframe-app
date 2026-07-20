import type { ComputedRef, InjectionKey } from 'vue'
import type { PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import type { I18n } from '@/vue/i18n'
import { computed, provide } from 'vue'
import { findBlock, resolveInheritedStyles } from '@/core'
import { displayBlockLabel } from '@/vue/utils/block-label'

export interface StyleInheritanceContext {
  get: (key: string) => { value: string, from: string } | undefined
}

export const STYLE_INHERITANCE_KEY: InjectionKey<StyleInheritanceContext> = Symbol('styleInheritance')

interface UseStyleInheritanceOptions {
  editor: PageEditorInstance
  block: ComputedRef<PageBlock | undefined>
  t: I18n['t']
}

/** Provides inherited style values and their source to the panel's style fields. */
export function useStyleInheritance({ editor, block, t }: UseStyleInheritanceOptions) {
  const inheritedStyles = computed(() => {
    if (!block.value)
      return {}
    return resolveInheritedStyles(
      editor.document.value.blocks,
      editor.effectiveDocument.value.styles ?? {},
      editor.effectiveDocument.value.settings.style,
      block.value.id,
    )
  })

  function inheritanceSource(from: string): string {
    if (from === 'page')
      return t('properties.body')
    const source = findBlock(editor.document.value.blocks, from)
    if (!source)
      return from
    const className = source.classes?.[0]
    return className
      ? `.${className}`
      : displayBlockLabel(source, editor.registry.value[source.type], t)
  }

  provide(STYLE_INHERITANCE_KEY, {
    get(key) {
      const hit = inheritedStyles.value[key]
      if (hit)
        return { value: hit.value, from: inheritanceSource(hit.from) }
      const defaults = editor.globals.value?.defaults?.style as Record<string, unknown> | undefined
      const value = defaults?.[key]
      return value != null && value !== ''
        ? { value: String(value), from: t('properties.globalDefaults') }
        : undefined
    },
  })
}
