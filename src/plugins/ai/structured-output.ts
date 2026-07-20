import type { AiBlockSpec } from './template-spec'
import type { BlockDefinition, BlockRegistry } from '@/core'
import { z } from 'zod'

type JsonSchema = Record<string, unknown>

interface StructuredProperty {
  key: string
  value: string | number | boolean
}

interface StructuredAiBlock {
  type: string
  props: StructuredProperty[]
  styles: Array<Pick<StructuredProperty, 'key'> & { value: string | number }>
  classes: string[]
  children: StructuredAiBlock[]
}

interface StructuredAiResponse {
  blocks: StructuredAiBlock[]
  note: string | null
}

// Structured Outputs requires all object fields to be required and rejects
// arbitrary object keys. The model therefore returns props and styles as
// key/value arrays; these are normalized back to the editor's compact format.
const structuredPropertySchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

const structuredAiBlockSchema: z.ZodType<StructuredAiBlock> = z.lazy(() =>
  z.object({
    type: z.string(),
    props: z.array(structuredPropertySchema),
    styles: z.array(z.object({
      key: z.string(),
      value: z.union([z.string(), z.number()]),
    })),
    classes: z.array(z.string()),
    children: z.array(structuredAiBlockSchema),
  }),
)

const structuredAiResponseSchema: z.ZodType<StructuredAiResponse> = z.object({
  blocks: z.array(structuredAiBlockSchema),
  note: z.string().nullable(),
})

const structuredStyleKeys = [
  'display',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'gap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridAutoFlow',
  'gridAutoColumns',
  'gridAutoRows',
  'justifyItems',
  'alignContent',
  'gridColumn',
  'gridRow',
  'justifySelf',
  'alignSelf',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'overflow',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'color',
  'textAlign',
  'textTransform',
  'textDecoration',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'borderColor',
  'borderTopStyle',
  'borderRightStyle',
  'borderBottomStyle',
  'borderLeftStyle',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'cornerShape',
  'opacity',
  'transform',
  'cursor',
]

function propsFor(definition: BlockDefinition): string[] {
  const keys = new Set(Object.keys(definition.defaultProps ?? {}))
  if (!definition.propsSchema)
    return [...keys]

  // Built-in blocks use Zod schemas. Third-party Standard Schema validators may
  // not be introspectable, so their default-prop keys remain the safe fallback.
  try {
    const jsonSchema = z.toJSONSchema(definition.propsSchema as z.ZodType) as JsonSchema
    const properties = jsonSchema.properties
    if (properties && typeof properties === 'object') {
      for (const key of Object.keys(properties))
        keys.add(key)
    }
  }
  catch { /* default-prop keys are still valid */ }

  return [...keys]
}

function propertyEntrySchema(keys: string[], value: JsonSchema): JsonSchema {
  return {
    type: 'object',
    properties: {
      key: keys.length ? { type: 'string', enum: keys } : { type: 'string' },
      value,
    },
    required: ['key', 'value'],
    additionalProperties: false,
  }
}

/** Build OpenAI's strict JSON Schema for the model-facing transport format. */
export function buildStructuredOutputFormat(registry: BlockRegistry) {
  const propKeys = [...new Set(Object.values(registry).flatMap(propsFor))]
  const primitiveValue = { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] }
  const styleValue = { anyOf: [{ type: 'string' }, { type: 'number' }] }

  const schema: JsonSchema = {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        items: { $ref: '#/$defs/block' },
      },
      note: { type: ['string', 'null'] },
    },
    required: ['blocks', 'note'],
    additionalProperties: false,
    $defs: {
      block: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: Object.keys(registry) },
          props: {
            type: 'array',
            items: propertyEntrySchema(propKeys, primitiveValue),
          },
          styles: {
            type: 'array',
            items: propertyEntrySchema(structuredStyleKeys, styleValue),
          },
          classes: { type: 'array', items: { type: 'string' } },
          children: { type: 'array', items: { $ref: '#/$defs/block' } },
        },
        required: ['type', 'props', 'styles', 'classes', 'children'],
        additionalProperties: false,
      },
    },
  }

  return {
    type: 'json_schema' as const,
    json_schema: {
      name: 'uframe_blocks',
      strict: true,
      schema,
    },
  }
}

/** Convert the strict transport response into the existing editor block spec. */
export function normalizeStructuredResponse(value: unknown): { blocks: AiBlockSpec[], note?: string } | undefined {
  const result = structuredAiResponseSchema.safeParse(value)
  if (!result.success)
    return undefined

  function normalize(block: StructuredAiBlock): AiBlockSpec {
    const props = Object.fromEntries(block.props.map(({ key, value }) => [key, value]))
    const style = Object.fromEntries(block.styles.map(({ key, value }) => [key, value]))
    const spec: AiBlockSpec = { type: block.type }
    if (Object.keys(props).length)
      spec.props = props
    if (Object.keys(style).length)
      spec.style = style
    if (block.classes.length)
      spec.classes = block.classes
    if (block.children.length)
      spec.children = block.children.map(normalize)
    return spec
  }

  return {
    blocks: result.data.blocks.map(normalize),
    ...(result.data.note ? { note: result.data.note } : {}),
  }
}
