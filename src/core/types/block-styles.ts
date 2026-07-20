export type CssLength = string

export type DisplayValue = 'block' | 'inline-block' | 'inline' | 'flex' | 'inline-flex' | 'grid' | 'none'
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
export type AlignItems = 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'
export type GridAutoFlow = 'row' | 'column' | 'row dense' | 'column dense'
export type JustifyItems = 'start' | 'end' | 'center' | 'stretch'
export type AlignContent = 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'
export type JustifySelf = 'auto' | 'start' | 'end' | 'center' | 'stretch'
export type AlignSelf = 'auto' | 'start' | 'end' | 'center' | 'stretch'
export type PositionValue = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
export type OverflowValue = 'visible' | 'hidden' | 'scroll' | 'auto'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type FontStyle = 'normal' | 'italic'
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type TextDecoration = 'none' | 'underline' | 'line-through'
/** Any CSS numeric weight (1–1000), including variable-font instances. */
export type FontWeight = number
// The full CSS <line-style> set (`hidden` behaves like `none` outside table
// border collapsing but is kept for completeness).
export type BorderStyle = 'none' | 'hidden' | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'
// CSS `corner-shape` keywords (the superellipse() form is not exposed in the
// editor). Only takes effect alongside a non-zero border radius.
export type CornerShape = 'round' | 'squircle' | 'bevel' | 'scoop' | 'notch' | 'square'
export type BackgroundRepeat = 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
export type BackgroundSize = 'auto' | 'cover' | 'contain' | CssLength
export type BackgroundPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | CssLength

export interface LayoutStyles {
  display?: DisplayValue
  flexDirection?: FlexDirection
  flexWrap?: FlexWrap
  justifyContent?: JustifyContent
  alignItems?: AlignItems
  gap?: CssLength
  // CSS Grid container
  gridTemplateColumns?: CssLength
  gridTemplateRows?: CssLength
  gridAutoFlow?: GridAutoFlow
  gridAutoColumns?: CssLength
  gridAutoRows?: CssLength
  justifyItems?: JustifyItems
  alignContent?: AlignContent
  // CSS Grid item (applies when the parent is a grid)
  gridColumn?: CssLength
  gridRow?: CssLength
  justifySelf?: JustifySelf
  alignSelf?: AlignSelf
  // Flex item (applies when the parent is flex)
  flexGrow?: number
  flexShrink?: number
  flexBasis?: CssLength
  position?: PositionValue
  top?: CssLength
  right?: CssLength
  bottom?: CssLength
  left?: CssLength
  zIndex?: number
  overflow?: OverflowValue
}

export interface SizeStyles {
  width?: CssLength
  height?: CssLength
  minWidth?: CssLength
  minHeight?: CssLength
  maxWidth?: CssLength
  maxHeight?: CssLength
}

export interface SpacingStyles {
  marginTop?: CssLength
  marginRight?: CssLength
  marginBottom?: CssLength
  marginLeft?: CssLength
  paddingTop?: CssLength
  paddingRight?: CssLength
  paddingBottom?: CssLength
  paddingLeft?: CssLength
}

export interface TypographyStyles {
  fontFamily?: string
  fontSize?: CssLength
  fontWeight?: FontWeight
  fontStyle?: FontStyle
  lineHeight?: CssLength
  letterSpacing?: CssLength
  color?: string
  textAlign?: TextAlign
  textTransform?: TextTransform
  textDecoration?: TextDecoration
}

export interface BackgroundStyles {
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: BackgroundSize
  backgroundPosition?: BackgroundPosition
  backgroundRepeat?: BackgroundRepeat
}

export interface BorderStyles {
  borderTopWidth?: CssLength
  borderRightWidth?: CssLength
  borderBottomWidth?: CssLength
  borderLeftWidth?: CssLength
  borderStyle?: BorderStyle
  borderColor?: string
  borderTopStyle?: BorderStyle
  borderRightStyle?: BorderStyle
  borderBottomStyle?: BorderStyle
  borderLeftStyle?: BorderStyle
  borderTopColor?: string
  borderRightColor?: string
  borderBottomColor?: string
  borderLeftColor?: string
  borderTopLeftRadius?: CssLength
  borderTopRightRadius?: CssLength
  borderBottomLeftRadius?: CssLength
  borderBottomRightRadius?: CssLength
  /** Shape of the rounded corners (`round` = CSS initial, stored as undefined). */
  cornerShape?: CornerShape
}

/**
 * The CSS filter functions usable in both `filter` and `backdrop-filter`.
 * `drop-shadow` is the only multi-argument one; the rest take a single amount.
 */
export type FilterFnType
  = | 'blur'
    | 'brightness'
    | 'contrast'
    | 'grayscale'
    | 'hue-rotate'
    | 'invert'
    | 'opacity'
    | 'saturate'
    | 'sepia'
    | 'drop-shadow'

/**
 * One entry in a `filter` / `backdrop-filter` stack. Stored structured (not as a
 * raw CSS string) so the editor can reorder, toggle visibility, and edit each
 * function individually; serialized to a CSS string at render time.
 *
 * `amount` carries the single value for every type except `drop-shadow`, whose
 * unit is implied by the type (px / % / deg — see FILTER_FN_META). `drop-shadow`
 * uses `x` / `y` / `blur` (px) + `color` instead.
 */
export interface FilterEntry {
  id: string
  type: FilterFnType
  enabled: boolean
  amount?: number
  x?: number
  y?: number
  blur?: number
  color?: string
}

/**
 * One `box-shadow` layer. Stored structured (like FilterEntry) so the editor can
 * stack, reorder, toggle and edit each shadow; serialized to a comma-separated
 * CSS `box-shadow` value at render time. `inset` switches outer ↔ inner.
 */
export interface ShadowEntry {
  id: string
  enabled: boolean
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: string
}

export interface EffectStyles {
  opacity?: number
  boxShadow?: ShadowEntry[]
  filter?: FilterEntry[]
  backdropFilter?: FilterEntry[]
  transform?: string
  cursor?: string
}

export interface BaseBlockStyles extends
  LayoutStyles,
  SizeStyles,
  SpacingStyles,
  TypographyStyles,
  BackgroundStyles,
  BorderStyles,
  EffectStyles {}

export const STYLE_STATES = ['hover', 'focus', 'active'] as const
export type StyleState = typeof STYLE_STATES[number]

export type BreakpointDirection = 'min' | 'max' | 'between'

// A breakpoint is fully user-defined and stored in the document
// (`settings.breakpoints`). `id` is a stable key used in `BlockStyles.responsive`.
export interface BreakpointDef {
  id: string
  label: string
  /**
   * - `min` → desktop-up (applies at width ≥ width)
   * - `max` → mobile-down (applies at width ≤ width)
   * - `between` → applies when width ∈ [width, widthMax]
   */
  direction: BreakpointDirection
  width: number
  /** Upper bound, used only when `direction === 'between'`. */
  widthMax?: number
  /** Chosen device-icon key (see BREAKPOINT_ICONS); falls back to width-derived. */
  icon?: string
}

// Seed set used when a document defines no breakpoints of its own. Users can
// add/remove/edit from here; nothing about the set is hard-coded downstream.
export const DEFAULT_BREAKPOINTS: BreakpointDef[] = [
  { id: 'wide', label: 'Wide', direction: 'min', width: 1440 },
  { id: 'tablet', label: 'Tablet', direction: 'max', width: 1024 },
  { id: 'mobile', label: 'Mobile', direction: 'max', width: 768 },
  { id: 'mobileSm', label: 'Mobile S', direction: 'max', width: 480 },
]

// Breakpoint ids are arbitrary user strings, so this is just `string`.
export type StyleBreakpoint = string

// The style layer currently being edited: the literal `'base'` (all-widths
// styles) or a breakpoint id. Plain `string` (not `'base' | string`) so literal
// narrowing works at call sites.
export type StyleViewport = string

export interface BlockStyles extends BaseBlockStyles {
  states?: Partial<Record<StyleState, BaseBlockStyles>>
  responsive?: Record<string, BaseBlockStyles>
}

export const STYLE_SECTIONS = ['layout', 'size', 'spacing', 'typography', 'background', 'border', 'effects'] as const
export type StyleSection = typeof STYLE_SECTIONS[number]
