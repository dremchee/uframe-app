import { z } from 'zod'

export const textBlockPropsSchema = z.object({
  content: z.string(),
})

export const headingBlockPropsSchema = z.object({
  content: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]).optional(),
})

export const imageBlockPropsSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
})

export const buttonBlockPropsSchema = z.object({
  label: z.string(),
  href: z.string(),
  kind: z.enum(['link', 'button', 'submit', 'reset']).optional(),
})

export const spacerBlockPropsSchema = z.object({
  height: z.number().min(0).max(640),
})

export const sectionBlockPropsSchema = z.object({})

export const containerBlockPropsSchema = z.object({})

export const divBlockPropsSchema = z.object({})

export const slotBlockPropsSchema = z.object({
  name: z.string().regex(/^[a-z_][\w-]*$/i, 'Invalid slot name'),
})

// Data blocks (data-list / data-item): config lives in `block.source`.
export const dataListBlockPropsSchema = z.object({})

export const dataItemBlockPropsSchema = z.object({})

export const linkBlockPropsSchema = z.object({
  href: z.string(),
  target: z.enum(['_self', '_blank', '_parent', '_top']).optional(),
  rel: z.string().optional(),
})

export const listBlockPropsSchema = z.object({
  ordered: z.boolean().optional(),
})

export const listItemBlockPropsSchema = z.object({})

export const paragraphBlockPropsSchema = z.object({
  content: z.string(),
})

export const embedBlockPropsSchema = z.object({
  html: z.string(),
})

export const dividerBlockPropsSchema = z.object({})

// ── Forms ───────────────────────────────────────────────────────────────────

export const formBlockPropsSchema = z.object({
  action: z.string().optional(),
  method: z.enum(['get', 'post']).optional(),
  name: z.string().optional(),
})

export const inputFieldTypeSchema = z.enum([
  'text',
  'email',
  'tel',
  'password',
  'number',
  'url',
  'search',
  'date',
  'time',
])

export const inputBlockPropsSchema = z.object({
  name: z.string(),
  type: inputFieldTypeSchema.optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
})

export const textAreaBlockPropsSchema = z.object({
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().int().min(1).max(40).optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
})

export const labelBlockPropsSchema = z.object({
  text: z.string(),
  for: z.string().optional(),
})

export const checkboxBlockPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  value: z.string().optional(),
  checked: z.boolean().optional(),
  required: z.boolean().optional(),
})

export const radioBlockPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  value: z.string(),
  checked: z.boolean().optional(),
  required: z.boolean().optional(),
})

export const selectBlockPropsSchema = z.object({
  name: z.string(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
})

export const selectOptionBlockPropsSchema = z.object({
  value: z.string(),
  label: z.string(),
  selected: z.boolean().optional(),
  disabled: z.boolean().optional(),
})
