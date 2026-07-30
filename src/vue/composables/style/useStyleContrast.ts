import type { ComputedRef, InjectionKey } from 'vue'
import type { BaseBlockStyles, PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed, provide } from 'vue'
import { calculateContrast, findBlock, findBlockParentId, resolveVarValue } from '@/core'
import { blockStyleValue } from '@/core/utils/style-inheritance'

export type ContrastEvaluation
  = | { status: 'ready', ratio: number, level: 'aaa' | 'aa' | 'fail', foreground: string, background: string }
    | { status: 'unavailable', reason: 'color' | 'background' }

export interface StyleContrastContext {
  evaluate: (styles: BaseBlockStyles) => ContrastEvaluation
}

export const STYLE_CONTRAST_KEY: InjectionKey<StyleContrastContext> = Symbol('styleContrast')

interface UseStyleContrastOptions {
  editor: PageEditorInstance
  block: ComputedRef<PageBlock | undefined>
}

/** Provides a read-only contrast evaluator for the currently selected block. */
export function useStyleContrast({ editor, block }: UseStyleContrastOptions) {
  const variables = computed(() => new Map(
    (editor.effectiveDocument.value.variables ?? []).map(variable => [variable.key, variable.value]),
  ))

  function resolveColor(value: unknown): string | undefined {
    if (typeof value !== 'string' || !value.trim())
      return undefined
    return resolveVarValue(value, variables.value).trim()
  }

  function ancestors(selected: PageBlock): PageBlock[] {
    const chain = [selected]
    let parentId = findBlockParentId(editor.document.value.blocks, selected.id)
    while (parentId) {
      const parent = findBlock(editor.document.value.blocks, parentId)
      if (!parent)
        break
      chain.push(parent)
      parentId = findBlockParentId(editor.document.value.blocks, parent.id)
    }
    return chain
  }

  function evaluate(override: BaseBlockStyles): ContrastEvaluation {
    const selected = block.value
    const document = editor.effectiveDocument.value
    const styleMap = document.styles ?? {}
    const globalStyle = editor.globals.value?.defaults?.style

    if (!selected) {
      if (override.backgroundImage?.trim())
        return { status: 'unavailable', reason: 'background' }
      const foreground = resolveColor(override.color ?? document.settings.style?.color ?? globalStyle?.color ?? '#000')
      const background = resolveColor(override.backgroundColor ?? document.settings.background)
      if (foreground && background) {
        const result = calculateContrast(foreground, background)
        if (result)
          return { status: 'ready', foreground, background, ...result }
      }
      return { status: 'unavailable', reason: foreground ? 'background' : 'color' }
    }

    const chain = ancestors(selected)
    const selectedValue = (key: keyof BaseBlockStyles) =>
      override[key] !== undefined ? override[key] : blockStyleValue(selected, styleMap, key)

    let foreground = resolveColor(selectedValue('color'))
    if (!foreground) {
      for (const ancestor of chain.slice(1)) {
        foreground = resolveColor(blockStyleValue(ancestor, styleMap, 'color'))
        if (foreground)
          break
      }
    }
    foreground ??= resolveColor(document.settings.style?.color ?? globalStyle?.color ?? '#000')

    let background: string | undefined
    for (const surface of chain) {
      const image = surface.id === selected.id
        ? selectedValue('backgroundImage')
        : blockStyleValue(surface, styleMap, 'backgroundImage')
      if (typeof image === 'string' && image.trim())
        return { status: 'unavailable', reason: 'background' }
      const color = surface.id === selected.id
        ? selectedValue('backgroundColor')
        : blockStyleValue(surface, styleMap, 'backgroundColor')
      background = resolveColor(color)
      if (background)
        break
    }
    background ??= resolveColor(document.settings.background)

    if (foreground && background) {
      const result = calculateContrast(foreground, background)
      if (result)
        return { status: 'ready', foreground, background, ...result }
    }
    return { status: 'unavailable', reason: foreground ? 'background' : 'color' }
  }

  provide(STYLE_CONTRAST_KEY, { evaluate })
}
