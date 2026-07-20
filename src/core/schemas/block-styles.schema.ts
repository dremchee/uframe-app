import { z } from 'zod'

const length = z.string().min(1)
const optionalLength = length.optional()

export const displaySchema = z.enum(['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'none'])
export const flexDirectionSchema = z.enum(['row', 'row-reverse', 'column', 'column-reverse'])
export const flexWrapSchema = z.enum(['nowrap', 'wrap', 'wrap-reverse'])
export const justifyContentSchema = z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'])
export const alignItemsSchema = z.enum(['stretch', 'flex-start', 'flex-end', 'center', 'baseline'])
export const gridAutoFlowSchema = z.enum(['row', 'column', 'row dense', 'column dense'])
export const justifyItemsSchema = z.enum(['start', 'end', 'center', 'stretch'])
export const alignContentSchema = z.enum(['start', 'end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly'])
export const justifySelfSchema = z.enum(['auto', 'start', 'end', 'center', 'stretch'])
export const alignSelfSchema = z.enum(['auto', 'start', 'end', 'center', 'stretch'])
export const positionSchema = z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky'])
export const overflowSchema = z.enum(['visible', 'hidden', 'scroll', 'auto'])
export const textAlignSchema = z.enum(['left', 'center', 'right', 'justify'])
export const fontStyleSchema = z.enum(['normal', 'italic'])
export const textTransformSchema = z.enum(['none', 'uppercase', 'lowercase', 'capitalize'])
export const textDecorationSchema = z.enum(['none', 'underline', 'line-through'])
// CSS supports every numeric font weight from 1 through 1000. Variable fonts
// frequently expose intermediate values such as 450, 550, or 650.
export const fontWeightSchema = z.number().finite().min(1).max(1000)
export const borderStyleSchema = z.enum(['none', 'hidden', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'])
export const cornerShapeSchema = z.enum(['round', 'squircle', 'bevel', 'scoop', 'notch', 'square'])
export const backgroundRepeatSchema = z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y'])

export const filterFnTypeSchema = z.enum([
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'opacity',
  'saturate',
  'sepia',
  'drop-shadow',
])
export const filterEntrySchema = z.object({
  id: z.string().min(1),
  type: filterFnTypeSchema,
  enabled: z.boolean(),
  amount: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  blur: z.number().optional(),
  color: z.string().optional(),
})
export const filterListSchema = z.array(filterEntrySchema)

export const shadowEntrySchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  inset: z.boolean(),
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  spread: z.number(),
  color: z.string(),
})
export const shadowListSchema = z.array(shadowEntrySchema)

export const baseBlockStylesSchema = z.object({
  display: displaySchema.optional(),
  flexDirection: flexDirectionSchema.optional(),
  flexWrap: flexWrapSchema.optional(),
  justifyContent: justifyContentSchema.optional(),
  alignItems: alignItemsSchema.optional(),
  gap: optionalLength,
  gridTemplateColumns: optionalLength,
  gridTemplateRows: optionalLength,
  gridAutoFlow: gridAutoFlowSchema.optional(),
  gridAutoColumns: optionalLength,
  gridAutoRows: optionalLength,
  justifyItems: justifyItemsSchema.optional(),
  alignContent: alignContentSchema.optional(),
  gridColumn: optionalLength,
  gridRow: optionalLength,
  justifySelf: justifySelfSchema.optional(),
  alignSelf: alignSelfSchema.optional(),
  flexGrow: z.number().nonnegative().optional(),
  flexShrink: z.number().nonnegative().optional(),
  flexBasis: optionalLength,
  position: positionSchema.optional(),
  top: optionalLength,
  right: optionalLength,
  bottom: optionalLength,
  left: optionalLength,
  zIndex: z.number().int().optional(),
  overflow: overflowSchema.optional(),

  width: optionalLength,
  height: optionalLength,
  minWidth: optionalLength,
  minHeight: optionalLength,
  maxWidth: optionalLength,
  maxHeight: optionalLength,

  marginTop: optionalLength,
  marginRight: optionalLength,
  marginBottom: optionalLength,
  marginLeft: optionalLength,
  paddingTop: optionalLength,
  paddingRight: optionalLength,
  paddingBottom: optionalLength,
  paddingLeft: optionalLength,

  fontFamily: z.string().optional(),
  fontSize: optionalLength,
  fontWeight: fontWeightSchema.optional(),
  fontStyle: fontStyleSchema.optional(),
  lineHeight: optionalLength,
  letterSpacing: optionalLength,
  color: z.string().optional(),
  textAlign: textAlignSchema.optional(),
  textTransform: textTransformSchema.optional(),
  textDecoration: textDecorationSchema.optional(),

  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundSize: z.string().optional(),
  backgroundPosition: z.string().optional(),
  backgroundRepeat: backgroundRepeatSchema.optional(),

  borderTopWidth: optionalLength,
  borderRightWidth: optionalLength,
  borderBottomWidth: optionalLength,
  borderLeftWidth: optionalLength,
  borderStyle: borderStyleSchema.optional(),
  borderColor: z.string().optional(),
  borderTopStyle: borderStyleSchema.optional(),
  borderRightStyle: borderStyleSchema.optional(),
  borderBottomStyle: borderStyleSchema.optional(),
  borderLeftStyle: borderStyleSchema.optional(),
  borderTopColor: z.string().optional(),
  borderRightColor: z.string().optional(),
  borderBottomColor: z.string().optional(),
  borderLeftColor: z.string().optional(),
  borderTopLeftRadius: optionalLength,
  borderTopRightRadius: optionalLength,
  borderBottomLeftRadius: optionalLength,
  borderBottomRightRadius: optionalLength,
  cornerShape: cornerShapeSchema.optional(),

  opacity: z.number().min(0).max(1).optional(),
  boxShadow: shadowListSchema.optional(),
  filter: filterListSchema.optional(),
  backdropFilter: filterListSchema.optional(),
  transform: z.string().optional(),
  cursor: z.string().optional(),
})

export const blockStylesSchema = baseBlockStylesSchema.extend({
  states: z.object({
    hover: baseBlockStylesSchema.optional(),
    focus: baseBlockStylesSchema.optional(),
    active: baseBlockStylesSchema.optional(),
  }).optional(),
  responsive: z.record(z.string().min(1), baseBlockStylesSchema).optional(),
})
