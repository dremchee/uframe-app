import type { Ref } from 'vue'
import type { BaseBlockStyles } from '@/core'
import { inject, provide } from 'vue'
import { mergeStyles } from '@/core'
import { STYLE_INHERITANCE_KEY } from '@/vue/composables/style/useStyleInheritance'

const SECTION_KEYS = {
  Layout: ['display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns', 'gridTemplateRows', 'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows', 'justifyItems', 'alignContent', 'gridColumn', 'gridRow', 'justifySelf', 'alignSelf', 'flexGrow', 'flexShrink', 'flexBasis', 'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'overflow'],
  Size: ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'],
  Spacing: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  Typography: ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'textAlign', 'textTransform', 'textDecoration'],
  Background: ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat'],
  Borders: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle', 'borderColor', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'cornerShape'],
  Effects: ['opacity', 'boxShadow', 'filter', 'backdropFilter', 'transform', 'cursor'],
} as const

const displayOptions = ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'none']
const flexDirectionOptions = ['row', 'row-reverse', 'column', 'column-reverse']
const flexWrapOptions = ['nowrap', 'wrap', 'wrap-reverse']
const justifyContentOptions = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']
const alignItemsOptions = ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']
const overflowOptions = ['visible', 'hidden', 'scroll', 'auto']
const textAlignOptions = ['left', 'center', 'right', 'justify']
const textTransformOptions = ['none', 'uppercase', 'lowercase', 'capitalize']
const textDecorationOptions = ['none', 'underline', 'line-through']
const fontStyleOptions = ['normal', 'italic']

export function useStylePanelModel(
  styles: Ref<BaseBlockStyles>,
  emitUpdate: (value: BaseBlockStyles) => void,
) {
  function update(patch: Partial<BaseBlockStyles>) {
    emitUpdate(mergeStyles(styles.value, patch))
  }

  // Lets each StyleField show a hover reset action that clears its style key.
  provide('styleFieldReset', {
    isSet: (key: string) => (styles.value as Record<string, unknown>)[key] !== undefined,
    reset: (key: string) => update({ [key]: undefined } as Partial<BaseBlockStyles>),
  })

  function sectionModified(keys: readonly string[]): boolean {
    const currentStyles = styles.value as Record<string, unknown>
    return keys.some(key => currentStyles[key] !== undefined)
  }

  // The parent provides resolved ancestor values. Keep the fallback in the
  // caller so translation and field-specific presentation stay in the view.
  const inheritance = inject(STYLE_INHERITANCE_KEY, null)
  function inheritedPh(key: string, fallback: string): string {
    return inheritance?.get(key)?.value ?? fallback
  }

  function updateSpacing(value: BaseBlockStyles) {
    // SpacingControl can intentionally remove a side. Forward its full object
    // without merging, otherwise a cleared key would be restored.
    emitUpdate(value)
  }

  return {
    sectionKeys: SECTION_KEYS,
    sectionModified,
    update,
    inheritedPh,
    updateSpacing,
    displayOptions,
    flexDirectionOptions,
    flexWrapOptions,
    justifyContentOptions,
    alignItemsOptions,
    overflowOptions,
    textAlignOptions,
    textTransformOptions,
    textDecorationOptions,
    fontStyleOptions,
  }
}
