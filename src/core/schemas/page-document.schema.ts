import { z } from 'zod'
import { blockStylesSchema } from '@/core/schemas/block-styles.schema'

export const pageViewportSchema = z.enum(['responsive', 'desktop', 'tablet', 'mobile'])

// A user-defined responsive breakpoint. `id` keys into BlockStyles.responsive.
// `between` carries an upper bound in `widthMax` (must exceed `width`).
export const breakpointDefSchema = z.object({
  id: z.string().regex(/^[a-z_][\w-]*$/i, 'Invalid breakpoint id'),
  label: z.string(),
  direction: z.enum(['min', 'max', 'between']),
  width: z.number().int().positive(),
  widthMax: z.number().int().positive().optional(),
  icon: z.string().optional(),
}).refine(
  bp => bp.direction !== 'between' || (bp.widthMax !== undefined && bp.widthMax > bp.width),
  { message: 'between breakpoint needs widthMax greater than width', path: ['widthMax'] },
)

export const breakpointListSchema = z.array(breakpointDefSchema).optional()

export const pageSettingsSchema = z.object({
  width: pageViewportSchema,
  background: z.string(),
  style: blockStylesSchema.optional(),
  breakpoints: breakpointListSchema,
})

export const cssVarTypeSchema = z.enum(['color', 'size', 'number', 'font', 'shadow', 'other'])

// `key` is the stable CSS identifier (stored without `--`, emitted as `--key`
// and referenced via `var(--key)`); `name` is a free display label.
export const cssVariableSchema = z.object({
  key: z.string().regex(/^[a-z_][\w-]*$/i, 'Invalid CSS variable key'),
  name: z.string(),
  value: z.string(),
  type: cssVarTypeSchema,
})

export const fontProviderSchema = z.enum(['google', 'bunny', 'custom', 'local'])

export const fontDefSchema = z.object({
  family: z.string().min(1),
  provider: fontProviderSchema,
  weights: z.array(z.number().int().positive()).optional(),
  styles: z.array(z.enum(['normal', 'italic'])).optional(),
  subsets: z.array(z.string().min(1)).optional(),
  url: z.string().optional(),
})

export const fontConfigSchema = z.object({
  families: z.array(fontDefSchema).optional(),
})

export type JsonLiteral = string | number | boolean | null
export type JsonValue = JsonLiteral | JsonValue[] | { [key: string]: JsonValue }

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
)

export const blockDataSourceSchema = z.object({
  collection: z.string().min(1),
  sort: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  filter: z.record(z.string(), jsonValueSchema).optional(),
})

export const assetRefSchema = z.object({
  source: z.string().min(1),
  id: z.string().min(1),
  mime: z.string().optional(),
  transform: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    fit: z.enum(['cover', 'contain', 'inside', 'outside']).optional(),
    format: z.string().optional(),
  }).optional(),
})

export const pageBlockSchema: z.ZodType<{
  id: string
  type: string
  props: Record<string, JsonValue>
  name?: string
  style?: z.infer<typeof blockStylesSchema>
  classes?: string[]
  htmlId?: string
  hidden?: boolean
  children?: unknown[]
  bindings?: Record<string, string>
  source?: z.infer<typeof blockDataSourceSchema>
  asset?: z.infer<typeof assetRefSchema>
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    props: z.record(z.string(), jsonValueSchema),
    name: z.string().trim().min(1).optional(),
    style: blockStylesSchema.optional(),
    classes: z.array(z.string().min(1)).optional(),
    htmlId: z.string().optional(),
    hidden: z.boolean().optional(),
    children: z.array(pageBlockSchema).optional(),
    bindings: z.record(z.string(), z.string()).optional(),
    source: blockDataSourceSchema.optional(),
    asset: assetRefSchema.optional(),
  }),
)

export const symbolVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  classes: z.array(z.string().min(1)),
})

export const symbolPropertyControlTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'color',
  'url',
])

export const symbolPropertyDefinitionSchema = z.object({
  id: z.string().min(1),
  key: z.string().regex(/^[a-z_][\w-]*$/i, 'Invalid component property key'),
  label: z.string().min(1),
  labelKey: z.string().min(1).optional(),
  target: z.object({
    blockId: z.string().min(1),
    prop: z.string().min(1),
  }),
  control: z.object({
    type: symbolPropertyControlTypeSchema,
    options: z.array(z.object({
      label: z.string(),
      labelKey: z.string().min(1).optional(),
      value: z.union([z.string(), z.number()]),
    })).optional(),
    placeholder: z.string().optional(),
    placeholderKey: z.string().min(1).optional(),
  }),
})

export const symbolDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  root: pageBlockSchema,
  variants: z.array(symbolVariantSchema).min(1),
  defaultVariantId: z.string().min(1),
  properties: z.array(symbolPropertyDefinitionSchema).optional(),
  updatedAt: z.string(),
}).refine(
  symbol => symbol.variants.some(variant => variant.id === symbol.defaultVariantId),
  { message: 'defaultVariantId must reference one of the symbol variants', path: ['defaultVariantId'] },
)

export const pageDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  group: z.string().optional(),
  version: z.number().int().positive(),
  blocks: z.array(pageBlockSchema),
  settings: pageSettingsSchema,
  styles: z.record(z.string().min(1), blockStylesSchema).optional(),
  symbols: z.record(z.string().min(1), symbolDefinitionSchema).optional(),
  variables: z.array(cssVariableSchema).optional(),
  fonts: fontConfigSchema.optional(),
  updatedAt: z.string(),
})

export type PageDocumentInput = z.infer<typeof pageDocumentSchema>

// Context-level settings shared across a set of documents ("globals"). Stored and
// validated independently of any single PageDocument. See GlobalSettings in
// page-document.ts and docs/plans/global-globals-settings-plan.md.
export const globalSettingsSchema = z.object({
  variables: z.array(cssVariableSchema).optional(),
  breakpoints: breakpointListSchema,
  styles: z.record(z.string().min(1), blockStylesSchema).optional(),
  symbols: z.record(z.string().min(1), symbolDefinitionSchema).optional(),
  fonts: fontConfigSchema.optional(),
  defaults: z.object({
    background: z.string().optional(),
    style: blockStylesSchema.optional(),
  }).optional(),
  version: z.number().int().positive(),
  updatedAt: z.string(),
})

export type GlobalSettingsInput = z.infer<typeof globalSettingsSchema>
